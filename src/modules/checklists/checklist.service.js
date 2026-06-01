import db from '../../models/index.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as lifecycleService from '../../services/lifecycle.service.js';
import * as s3Service from '../../services/s3.service.js';

const { ActivityPlanning, ChecklistTemplate, JobRequest, JobCertificate, Survey } = db;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Resolve job_certificate_id from either jobId param or query
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a jobId (job_request_id) + optional job_certificate_id query param,
 * resolves the survey, job, and certId to work on.
 * If job_certificate_id is provided, uses that specific certificate.
 * Otherwise falls back to the first certificate for the job.
 */
const resolveJobAndCert = async (jobId, jobCertificateId = null) => {
    const job = await JobRequest.findByPk(jobId, { useMaster: true });
    if (!job) throw { statusCode: 404, message: 'The requested job could not be found.' };

    let certId = jobCertificateId;
    let jobCert = null;

    if (certId) {
        jobCert = await JobCertificate.findOne({
            where: { id: certId, job_request_id: jobId },
            useMaster: true
        });
        if (!jobCert) throw { statusCode: 404, message: 'Job certificate not found for this job.' };
    } else {
        // Fallback: pick the first certificate
        jobCert = await JobCertificate.findOne({
            where: { job_request_id: jobId },
            useMaster: true
        });
        if (jobCert) certId = jobCert.id;
    }

    // Find survey for this specific certificate
    const survey = certId
        ? await Survey.findOne({ where: { job_certificate_id: certId }, useMaster: true })
        : null;

    return { job, jobCert, certId, survey };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CHECKLIST — per certificate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns checklist items for a specific JobCertificate, plus the signed-checklist
 * scan files attached on the survey row.
 *
 * Supports:
 *   GET /checklists/jobs/:jobId?job_certificate_id=<uuid>
 *   GET /checklists/jobs/:jobId  (picks first certificate)
 */
export const getChecklist = async (jobId, filters = {}, user = null) => {
    const { answer, question_code, search, job_certificate_id } = filters;

    if (job_certificate_id) {
        return await getSingleChecklist(jobId, job_certificate_id, filters, user);
    } else {
        const job = await JobRequest.findByPk(jobId, { useMaster: true });
        if (!job) throw { statusCode: 404, message: 'The requested job could not be found.' };

        const certificates = await JobCertificate.findAll({
            where: { job_request_id: jobId },
            useMaster: true
        });

        if (!certificates || certificates.length === 0) return [];

        const checklists = [];
        for (const cert of certificates) {
            const cl = await getSingleChecklist(jobId, cert.id, filters, user);
            checklists.push(cl);
        }
        return checklists;
    }
};

const getSingleChecklist = async (jobId, job_certificate_id, filters, user) => {
    const { answer, question_code, search } = filters;
    const { job, jobCert, certId, survey } = await resolveJobAndCert(jobId, job_certificate_id);

    const where = certId ? { job_certificate_id: certId } : { job_id: jobId };

    if (answer) where.answer = answer;
    if (question_code) where.question_code = question_code;
    if (search) {
        where[db.Sequelize.Op.or] = [
            { question_text: { [db.Sequelize.Op.like]: `%${search}%` } },
            { remarks: { [db.Sequelize.Op.like]: `%${search}%` } }
        ];
    }

    const items = await ActivityPlanning.findAll({
        where,
        attributes: [
            'id', 'job_id', 'job_certificate_id',
            'question_code', 'question_text',
            'answer', 'remarks', 'file_url', 'status', 'rejection_reason',
            'created_at', 'updated_at'
        ]
    });

    const resolvedItems = await fileAccessService.resolveEntity(items, user);
    await ensureFullFileUrls(resolvedItems);

    const signedFiles = await resolveKeyArray(survey?.signed_checklist_files, user);

    let templateMeta = null;
    let templateFiles = [];
    let templateSections = [];
    try {
        const certTypeId = jobCert?.certificate_type_id;
        if (certTypeId) {
            const template = await ChecklistTemplate.findOne({
                where: { certificate_type_id: certTypeId, status: 'ACTIVE' },
                attributes: ['id', 'name', 'code', 'template_files', 'sections'],
            });
            if (template) {
                templateMeta = { id: template.id, name: template.name, code: template.code };
                templateSections = template.sections || [];
                const resolvedTemplate = await fileAccessService.resolveEntity(template, user);
                templateFiles = Array.isArray(resolvedTemplate?.template_files) ? resolvedTemplate.template_files : [];
            }
        }
    } catch (err) {
        templateMeta = null;
        templateFiles = [];
        templateSections = [];
    }

    return {
        job_certificate_id: certId,
        certificate_type_id: jobCert?.certificate_type_id,
        items: resolvedItems,
        signed_checklist_files: signedFiles,
        template_files: templateFiles,
        template: templateMeta,
        sections: templateSections
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT CHECKLIST — per certificate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persists checklist answers for a specific JobCertificate.
 * Body must include job_certificate_id to scope to the right certificate.
 *
 * PUT /checklists/jobs/:jobId
 * Body: { items: [...], job_certificate_id: uuid, signed_checklist_files: [...] }
 */
export const submitChecklist = async (jobId, items, user, signedChecklistFiles = null, jobCertificateId = null) => {
    const userObj = (typeof user === 'object' && user !== null) ? user : (user ? { id: user } : null);
    const userId = userObj?.id;

    const { job, jobCert, certId, survey } = await resolveJobAndCert(jobId, jobCertificateId);

    // ── Guard 1: Terminal state ──
    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `This job has already been closed and cannot be modified further.` };
    }

    // ── Guard 2: Post-finalization ──
    if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `The checklist cannot be updated as the job has already moved to ${job.job_status} status.` };
    }

    // ── Guard 3: Only the assigned surveyor ──
    const assignedSurveyorId = jobCert?.assigned_surveyor_id || job.assigned_surveyor_id;
    if (assignedSurveyorId !== userId) {
        throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
    }

    if (job.is_survey_required === false) {
        throw { statusCode: 400, message: 'Survey not required for this job.' };
    }

    if (!survey) throw { statusCode: 400, message: 'The survey has not been started yet for this certificate. Please check-in first.' };

    // ── Guard 4: Survey must be in an active state ──
    const activeStatuses = ['STARTED', 'CHECKLIST_SUBMITTED', 'PROOF_UPLOADED', 'REWORK_REQUIRED'];
    if (!activeStatuses.includes(survey.survey_status)) {
        throw { statusCode: 400, message: `The checklist cannot be modified as the survey is in ${survey.survey_status} status.` };
    }

    if (signedChecklistFiles !== null && signedChecklistFiles !== undefined && !Array.isArray(signedChecklistFiles)) {
        throw { statusCode: 400, message: 'signed_checklist_files must be an array of S3 keys.' };
    }

    const txn = await db.sequelize.transaction();
    try {
        const results = [];
        for (const item of items) {
            // Find by (job_certificate_id, question_code) — unique per certificate
            let record = await ActivityPlanning.findOne({
                where: {
                    job_certificate_id: certId,
                    question_code: item.question_code
                },
                transaction: txn
            });

            if (record) {
                await record.update({
                    ...item,
                    status: 'PENDING',
                    rejection_reason: null
                }, { transaction: txn });
            } else {
                record = await ActivityPlanning.create({
                    job_id: jobId,
                    job_certificate_id: certId,  // ← scoped to this certificate
                    ...item,
                    status: 'PENDING',
                    rejection_reason: null
                }, { transaction: txn });
            }
            results.push(record);
        }

        // Update signed checklist files on the survey for this certificate
        if (Array.isArray(signedChecklistFiles)) {
            const existingFiles = survey.signed_checklist_files || [];
            const existingUrlMap = new Map();
            existingFiles.forEach(f => {
                const u = typeof f === 'string' ? f : f.url;
                existingUrlMap.set(u, f);
            });

            const updatedFiles = [];
            for (const file of signedChecklistFiles) {
                const url = typeof file === 'string' ? file : file.url;
                if (existingUrlMap.has(url)) {
                    updatedFiles.push(existingUrlMap.get(url));
                } else {
                    updatedFiles.push({ url, status: 'PENDING', rejection_reason: null });
                }
            }
            survey.set('signed_checklist_files', updatedFiles);
            survey.changed('signed_checklist_files', true);
            await survey.save({ transaction: txn });
        }

        // Advance survey status
        if (['STARTED', 'REWORK_REQUIRED', 'CHECKLIST_SUBMITTED'].includes(survey.survey_status)) {
            const nextStatus = survey.evidence_proof_url ? 'PROOF_UPLOADED' : 'CHECKLIST_SUBMITTED';
            if (survey.survey_status !== nextStatus) {
                await lifecycleService.updateSurveyStatus(survey.id, nextStatus, userId,
                    'Checklist items submitted/corrected', { transaction: txn });
            }
        }

        await txn.commit();

        const resolvedItems = await fileAccessService.resolveEntity(results, userObj);
        await ensureFullFileUrls(resolvedItems);

        const persistedFiles = Array.isArray(signedChecklistFiles)
            ? (await Survey.findOne({ where: { id: survey.id }, attributes: ['signed_checklist_files'], useMaster: true })).signed_checklist_files
            : (survey.signed_checklist_files || []);
        const signedFilesResolved = await resolveKeyArray(persistedFiles, userObj);

        return {
            job_certificate_id: certId,
            items: resolvedItems,
            signed_checklist_files: signedFilesResolved
        };
    } catch (error) {
        if (!txn.finished) await txn.rollback();
        throw error;
    }
};

/**
 * Update ONLY the signed checklist scan S3 keys on the survey for a certificate.
 */
export const updateSignedChecklistFiles = async (jobId, signedChecklistFiles, user, jobCertificateId = null) => {
    const userObj = (typeof user === 'object' && user !== null) ? user : (user ? { id: user } : null);
    const userId = userObj?.id;

    const { job, jobCert, certId, survey } = await resolveJobAndCert(jobId, jobCertificateId);

    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `This job has already been closed and cannot be modified further.` };
    }
    if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `The checklist cannot be updated as the job has already moved to ${job.job_status} status.` };
    }
    const assignedSurveyorId = jobCert?.assigned_surveyor_id || job.assigned_surveyor_id;
    if (assignedSurveyorId !== userId) {
        throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
    }
    if (!Array.isArray(signedChecklistFiles)) {
        throw { statusCode: 400, message: 'signed_checklist_files must be an array of S3 keys.' };
    }
    if (!survey) throw { statusCode: 400, message: 'The survey has not been started yet. Please check-in first.' };

    const activeStatuses = ['STARTED', 'CHECKLIST_SUBMITTED', 'PROOF_UPLOADED', 'REWORK_REQUIRED'];
    if (!activeStatuses.includes(survey.survey_status)) {
        throw { statusCode: 400, message: `The signed checklist files cannot be modified as the survey is in ${survey.survey_status} status.` };
    }

    const existingFiles = survey.signed_checklist_files || [];
    const existingUrlMap = new Map();
    existingFiles.forEach(f => {
        const u = typeof f === 'string' ? f : f.url;
        existingUrlMap.set(u, f);
    });

    const updatedFiles = [];
    for (const file of signedChecklistFiles) {
        const url = typeof file === 'string' ? file : file.url;
        if (existingUrlMap.has(url)) {
            updatedFiles.push(existingUrlMap.get(url));
        } else {
            updatedFiles.push({ url, status: 'PENDING', rejection_reason: null });
        }
    }

    survey.set('signed_checklist_files', updatedFiles);
    survey.changed('signed_checklist_files', true);
    await survey.save();

    const signedFilesResolved = await resolveKeyArray(updatedFiles, userObj);
    return { job_certificate_id: certId, signed_checklist_files: signedFilesResolved };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD URLS
// ─────────────────────────────────────────────────────────────────────────────

export const getSignedUploadUrl = async (jobId, fileName, contentType, userId, jobCertificateId = null) => {
    const { job, jobCert } = await resolveJobAndCert(jobId, jobCertificateId);
    const assignedSurveyorId = jobCert?.assigned_surveyor_id || job.assigned_surveyor_id;
    if (assignedSurveyorId !== userId) {
        throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
    }
    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `This job has already been closed and cannot be modified further.` };
    }

    const certIdPart = jobCertificateId || jobId;
    const key = `surveys/checklist-evidence/${certIdPart}/${Date.now()}_${fileName}`;
    const signedUrl = await s3Service.getUploadSignedUrl(key, contentType);
    return { uploadUrl: signedUrl, fileKey: key };
};

export const getSignedChecklistUploadUrl = async (jobId, fileName, contentType, userId, jobCertificateId = null) => {
    const { job, jobCert } = await resolveJobAndCert(jobId, jobCertificateId);
    const assignedSurveyorId = jobCert?.assigned_surveyor_id || job.assigned_surveyor_id;
    if (assignedSurveyorId !== userId) {
        throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
    }
    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `This job has already been closed and cannot be modified further.` };
    }
    if (job.is_survey_required === false) {
        throw { statusCode: 400, message: 'Survey not required for this job.' };
    }

    const certIdPart = jobCertificateId || jobId;
    const key = `surveys/signed-checklists/${certIdPart}/${Date.now()}_${fileName}`;
    const signedUrl = await s3Service.getUploadSignedUrl(key, contentType);
    return { uploadUrl: signedUrl, fileKey: key };
};

// ─────────────────────────────────────────────────────────────────────────────
// TM/TO REVIEW ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TO action to approve/reject a specific checklist item (scoped to a certificate).
 */
export const reviewChecklistItem = async (jobId, itemId, { status, rejection_reason }, user) => {
    if (!['TO', 'ADMIN'].includes(user.role)) {
        throw { statusCode: 403, message: 'Only Technical Officers (TO) and Admins have permission to review checklist items.' };
    }

    // Find item — scoped to job (via job_id OR job_certificate_id path)
    const item = await ActivityPlanning.findOne({
        where: {
            id: itemId,
            [db.Sequelize.Op.or]: [
                { job_id: jobId },
                { '$JobCertificate.job_request_id$': jobId }
            ]
        },
        include: [{ model: db.JobCertificate, required: false }],
        useMaster: true
    }).catch(() =>
        // fallback simple query
        ActivityPlanning.findOne({ where: { id: itemId, job_id: jobId }, useMaster: true })
    );

    if (!item) throw { statusCode: 404, message: 'Checklist item not found.' };

    await item.update({
        status,
        rejection_reason: status === 'REJECTED' ? rejection_reason : null
    });

    return item;
};

/**
 * TO action to approve/reject a signed checklist document (by index on the certificate's survey).
 */
export const reviewSignedDocument = async (jobId, fileIndex, { status, rejection_reason }, user, jobCertificateId = null) => {
    if (!['TO', 'ADMIN'].includes(user.role)) {
        throw { statusCode: 403, message: 'Only Technical Officers (TO) and Admins have permission to review documents.' };
    }

    // Find the survey — try per-certificate first
    const jobCerts = await JobCertificate.findAll({ where: { job_request_id: jobId }, useMaster: true });
    let survey = null;
    if (jobCertificateId) {
        // BUG FIX: scope to the specific certificate when provided
        survey = await Survey.findOne({ where: { job_certificate_id: jobCertificateId }, useMaster: true });
    } else if (jobCerts.length > 0) {
        // BUG FIX: must use Op.in for array of IDs
        survey = await Survey.findOne({
            where: { job_certificate_id: { [db.Sequelize.Op.in]: jobCerts.map(jc => jc.id) } },
            useMaster: true
        });
    }
    if (!survey) throw { statusCode: 404, message: 'Survey not found.' };

    const files = survey.signed_checklist_files || [];
    if (!files[fileIndex]) throw { statusCode: 400, message: 'Document not found at specified index.' };

    const updatedFiles = [...files];
    updatedFiles[fileIndex] = {
        ...(typeof updatedFiles[fileIndex] === 'string' ? { url: updatedFiles[fileIndex] } : updatedFiles[fileIndex]),
        status,
        rejection_reason: status === 'REJECTED' ? rejection_reason : null
    };

    survey.set('signed_checklist_files', updatedFiles);
    survey.changed('signed_checklist_files', true);
    await survey.save();

    return {
        index: fileIndex,
        file: await resolveKeyArray([updatedFiles[fileIndex]], user).then(res => res[0])
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const ensureFullFileUrls = async (rows) => {
    if (!rows) return rows;
    const list = Array.isArray(rows) ? rows : [rows];
    await Promise.all(list.map(async (row) => {
        if (!row || typeof row !== 'object') return;
        const value = row.file_url;
        if (!value) { row.file_url = null; return; }
        if (typeof value === 'string' && !value.startsWith('http')) {
            row.file_url = await fileAccessService.resolveUrl(value, null, true);
        }
    }));
    return rows;
};

const resolveKeyArray = async (items, user = null) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    return Promise.all(
        items.map(async (item) => {
            if (!item) return null;
            const isObject = typeof item === 'object' && item !== null;
            const rawKey = isObject ? item.url : item;
            if (typeof rawKey !== 'string' || rawKey.length === 0) return null;
            const fullUrl = rawKey.startsWith('http')
                ? rawKey
                : await fileAccessService.resolveUrl(rawKey, user, true);
            if (isObject) {
                let fileName = rawKey.split('/').pop() || rawKey;
                if (fileName.includes('_')) {
                    const parts = fileName.split('_');
                    if (!isNaN(parts[0])) fileName = parts.slice(1).join('_');
                }
                return { ...item, url: fullUrl, file_name: fileName };
            }
            return fullUrl;
        })
    ).then(results => results.filter(r => r !== null));
};
