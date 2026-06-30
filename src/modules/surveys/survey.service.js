import crypto from 'crypto';
import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as notificationService from '../../services/notification.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import { SURVEY_STATUSES } from '../../constants/statuses.js';
import { buildFullStatusCounts } from '../../utils/statusCount.util.js';
import { flatSurveyReportListRow } from '../../utils/listRowFlatten.util.js';
import * as lifecycleService from '../../services/lifecycle.service.js';
import logger from '../../utils/logger.js';

const { Survey, JobRequest, GpsTracking, ActivityPlanning, AuditLog, User } = db;

/**
 * Enforces immutability for finalized surveys.
 */
const assertSurveyNotFinalized = (survey) => {
    if (survey.survey_status === 'FINALIZED') {
        throw { statusCode: 400, message: 'Survey is finalized and cannot be modified.' };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ACCESS GUARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that the job exists, is not in a terminal state, and (optionally)
 * the caller is the assigned surveyor.
 */
const assertJobAccessible = async (jobId, userId, { checkSurveyor = true, allowedStatuses = null, jobCertificateId = null } = {}) => {
    const job = await JobRequest.findByPk(jobId, { useMaster: true });
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `This job has already been closed and cannot be modified further.` };
    }

    if (allowedStatuses) {
        if (jobCertificateId) {
            const jc = await db.JobCertificate.findByPk(jobCertificateId, { useMaster: true });
            if (jc && !allowedStatuses.includes(jc.status)) {
                throw { statusCode: 400, message: `This action can only be performed when the certificate is in ${allowedStatuses.join(', ')} state.` };
            }
        } else if (!allowedStatuses.includes(job.job_status)) {
            throw { statusCode: 400, message: `This action can only be performed when the job is in ${allowedStatuses.join(', ')} state.` };
        }
    }

    if (checkSurveyor) {
        let isAssigned = false;
        if (jobCertificateId) {
            const jc = await db.JobCertificate.findByPk(jobCertificateId, { useMaster: true });
            if (jc && jc.assigned_surveyor_id === userId) {
                isAssigned = true;
            }
        }
        
        if (!isAssigned) {
            if (job.assigned_surveyor_id === userId) {
                isAssigned = true;
            } else {
                const count = await db.JobCertificate.count({
                    where: { job_request_id: jobId, assigned_surveyor_id: userId },
                    useMaster: true
                });
                if (count > 0) {
                    isAssigned = true;
                }
            }
        }

        if (!isAssigned) {
            throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
        }
    }

    if (job.is_survey_required === false || job.is_survey_required === 0 || !job.is_survey_required) {
        throw { statusCode: 400, message: "Survey not required for this job." };
    }

    return job;
};

/**
 * Returns the survey for a job certificate, or throws if not found.
 * Can look up by job_certificate_id directly.
 */
const requireSurvey = async (jobId, jobCertificateId = null) => {
    if (jobCertificateId) {
        const survey = await Survey.findOne({ where: { job_certificate_id: jobCertificateId }, useMaster: true });
        if (!survey) throw { statusCode: 404, message: 'Survey report not found for this certificate. Please start the survey inspection first.' };
        return survey;
    }

    if (!jobId) throw { statusCode: 400, message: 'Either jobId or jobCertificateId must be provided.' };

    // jobId here refers to the job_request_id; find via JobCertificate
    const jobCerts = await db.JobCertificate.findAll({ where: { job_request_id: jobId }, useMaster: true });
    if (!jobCerts.length) throw { statusCode: 404, message: 'No certificates found for this job.' };

    if (jobCerts.length > 1) {
        throw { statusCode: 400, message: 'This job has multiple certificates. Please specify the job_certificate_id.' };
    }

    const survey = await Survey.findOne({
        where: { job_certificate_id: jobCerts[0].id },
        useMaster: true
    });
    if (!survey) throw { statusCode: 404, message: 'Survey report not found. Please start the survey inspection first.' };
    return survey;
};

/**
 * Returns ALL surveys for a job (one per certificate).
 */
const requireAllSurveys = async (jobId) => {
    const jobCerts = await db.JobCertificate.findAll({ where: { job_request_id: jobId }, useMaster: true });
    if (!jobCerts.length) return [];
    // BUG FIX: Must use Op.in for array of IDs
    return Survey.findAll({
        where: { job_certificate_id: { [db.Sequelize.Op.in]: jobCerts.map(jc => jc.id) } },
        useMaster: true
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Check-In / Start Survey
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SURVEYOR action.
 * Allowed when job is SURVEY_AUTHORIZED (first run) or REWORK_REQUESTED (rework re-check-in).
 * For first-time start: transitions NOT_STARTED → STARTED.
 * For rework: transitions REWORK_REQUIRED → STARTED (only those certs).
 *             Certs already past REWORK_REQUIRED (STARTED / CHECKLIST_SUBMITTED / etc.) are skipped.
 */
export const startSurvey = async (data, userId) => {
    const { job_id, job_certificate_id, latitude, longitude } = data;

    if (!job_id && !job_certificate_id) {
        throw { statusCode: 400, message: 'Either job_id or job_certificate_id is required.' };
    }

    // ── Resolve job_id from job_certificate_id if only cert provided ──
    let resolvedJobId = job_id;
    if (!resolvedJobId && job_certificate_id) {
        const jc = await db.JobCertificate.findByPk(job_certificate_id, { useMaster: true });
        if (!jc) throw { statusCode: 404, message: 'Job certificate not found.' };
        resolvedJobId = jc.job_request_id;
    }

    // ── Fetch certificates to start ──
    // If job_certificate_id is provided → start ONLY that one certificate's survey
    // If only job_id is provided → start ALL eligible certificates (legacy behavior)
    let certsToStart;
    if (job_certificate_id) {
        const jc = await db.JobCertificate.findOne({
            where: { id: job_certificate_id, job_request_id: resolvedJobId },
            include: [{ model: db.CertificateType, attributes: ['id', 'requires_survey'] }],
            useMaster: true
        });
        if (!jc) throw { statusCode: 404, message: 'Job certificate not found for this job.' };
        if (jc.CertificateType && jc.CertificateType.requires_survey === false) {
            throw { statusCode: 400, message: 'Survey is not required for this certificate type.' };
        }
        certsToStart = [jc];
    } else {
        certsToStart = await db.JobCertificate.findAll({
            where: { job_request_id: resolvedJobId },
            include: [{ model: db.CertificateType, attributes: ['id', 'requires_survey'] }],
            useMaster: true
        });
        if (!certsToStart.length) throw { statusCode: 404, message: 'No certificates found for this job.' };
    }

    // Guard: job must be SURVEY_AUTHORIZED, REWORK_REQUESTED, or IN_PROGRESS
    const job = await assertJobAccessible(resolvedJobId, userId, {
        checkSurveyor: true,
        allowedStatuses: ['SURVEY_AUTHORIZED', 'REWORK_REQUESTED', 'IN_PROGRESS']
    });

    const hasSurveyRequiredCert = certsToStart.some(c => !c.CertificateType || c.CertificateType.requires_survey !== false);
    if (!hasSurveyRequiredCert) {
        throw { statusCode: 400, message: 'Survey not required for the specified certificate(s).' };
    }

    const txn = await db.sequelize.transaction();
    let startedCount = 0;
    let alreadyInProgressCount = 0;
    try {
        for (const cert of certsToStart) {
            if (cert.CertificateType && cert.CertificateType.requires_survey === false) {
                continue;
            }

            const [survey, created] = await Survey.findOrCreate({
                where: { job_certificate_id: cert.id },
                defaults: { surveyor_id: userId, survey_status: 'NOT_STARTED' },
                transaction: txn
            });

            // During rework: only process REWORK_REQUIRED certs.
            // Skip certs that are already actively progressing or finalized.
            if (!created && !['NOT_STARTED', 'REWORK_REQUIRED'].includes(survey.survey_status)) {
                alreadyInProgressCount++;
                continue;
            }

            if (survey.survey_status !== 'STARTED') {
                // NOTE: _skipSurveyLog removed intentionally — we want "Surveyor checked in"
                // to appear in survey history for full audit trail.
                await lifecycleService.updateSurveyStatus(survey.id, 'STARTED', userId, 'Surveyor checked in', { transaction: txn });
            }

            await survey.update({
                started_at: new Date(),
                start_latitude: latitude,
                start_longitude: longitude
            }, { transaction: txn });

            await GpsTracking.create({ surveyor_id: userId, job_id: resolvedJobId, job_certificate_id: cert.id, latitude, longitude }, { transaction: txn });
            startedCount++;
        }

        const surveyRequiredCerts = certsToStart.filter(c => !c.CertificateType || c.CertificateType.requires_survey !== false);
        if (startedCount === 0 && surveyRequiredCerts.length > 0) {
            // All certs are already STARTED or beyond — return 409 so the
            // mobile client knows to navigate directly to the survey page.
            throw {
                statusCode: 409,
                message: `Survey already started for this certificate. Please continue the survey in progress.`
            };
        }

        await txn.commit();
    } catch (error) {
        if (!txn.finished) await txn.rollback();
        throw error;
    }

    // ── Post-commit notifications (non-transactional, fire-and-forget) ──
    logger.info({ entity: 'SURVEY', event: 'CHECKIN', jobId: resolvedJobId, jobCertificateId: job_certificate_id, triggeredBy: userId });
    try {
        const jobWithVessel = await JobRequest.findByPk(resolvedJobId, { include: ['Vessel'], useMaster: true });
        const actor = await User.findByPk(userId, { useMaster: true });
        notificationService.notifyRoles(['ADMIN', 'TM', 'TO'], 'SURVEY_STARTED', {
            jobId: resolvedJobId, vesselName: jobWithVessel?.Vessel?.vessel_name, surveyorName: actor?.name
        }).catch(() => { });
    } catch (notifErr) {
        logger.error('Non-critical: notification error in startSurvey', notifErr);
    }

    return {
        message: `Started ${startedCount} survey(s) successfully.`,
        job_id: resolvedJobId,
        job_certificate_id: job_certificate_id || null,
        started_count: startedCount
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Submit Checklist
// Handled in checklist.service. Guards repeated here for defence-in-depth.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Upload Evidence Proof
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SURVEYOR action.
 * Survey must be CHECKLIST_SUBMITTED (or REWORK_REQUIRED to allow re-upload).
 */
export const uploadProof = async (jobCertificateId, file, data, userId) => {
    const survey = await requireSurvey(null, jobCertificateId);
    const jc = await db.JobCertificate.findByPk(jobCertificateId, { useMaster: true });
    
    await assertJobAccessible(jc.job_request_id, userId, { checkSurveyor: true, jobCertificateId });

    assertSurveyNotFinalized(survey);
    const allowedProofStatuses = ['CHECKLIST_SUBMITTED', 'PROOF_UPLOADED', 'REWORK_REQUIRED'];
    if (!allowedProofStatuses.includes(survey.survey_status)) {
        throw { statusCode: 400, message: `Please complete the inspection checklist before uploading evidence proof.` };
    }

    // S3 upload (Moved to background if file provided)
    let url = data.fileKey; // Support pre-signed upload key
    if (file) {
        url = s3Service.generateKey(file.originalname, s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF);
        // Start upload in background
        s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, '', url)
            .catch(err => logger.error('Background S3 upload error (uploadProof):', err));
    }

    if (!url) throw { statusCode: 400, message: 'No file or fileKey provided' };

    const txn = await db.sequelize.transaction();
    try {
        await survey.update({ evidence_proof_url: url }, { transaction: txn });

        // Advance survey status ONLY if it's in a previous state (CHECKLIST_SUBMITTED or REWORK_REQUIRED)
        if (survey.survey_status !== 'PROOF_UPLOADED') {
            // Note: _skipSurveyLog is removed because this is now a per-certificate action and we WANT the log in survey_history.
            await lifecycleService.updateSurveyStatus(survey.id, 'PROOF_UPLOADED', userId, 'Evidence proof uploaded', { transaction: txn, _skipJobSync: true });
        }
        await txn.commit();

        // Notify ADMIN/TM/TO
        const jobWithVessel = await db.JobRequest.findByPk(jc.job_request_id, { include: ['Vessel'], useMaster: true });
        notificationService.notifyRoles(['ADMIN', 'TM', 'TO'], 'SURVEY_PROOF_UPLOADED', {
            jobId: jc.job_request_id, vesselName: jobWithVessel?.Vessel?.vessel_name
        }).catch(() => { });

        return await fileAccessService.resolveEntity({ url }, { id: userId });
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Submit Survey Report (Check-Out)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SURVEYOR action.
 * Survey must be PROOF_UPLOADED or REWORK_REQUIRED.
 * Job must not be PAYMENT_DONE or beyond.
 */
export const submitSurveyReport = async (jobCertificateId, data, files, userId) => {
    const { submit_latitude, submit_longitude, survey_statement } = data;

    const jc = await db.JobCertificate.findByPk(jobCertificateId, { useMaster: true });
    if (!jc) throw { statusCode: 404, message: 'Job Certificate not found.' };

    const job_id = jc.job_request_id;
    const job = await assertJobAccessible(job_id, userId, { checkSurveyor: true });

    // Guard: once payment is done, survey can no longer be submitted
    if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Survey report cannot be submitted as the job is already being finalized or certified.` };
    }

    const survey = await requireSurvey(null, jobCertificateId);

    // Validate ALL surveys
    const allowedStatuses = ['PROOF_UPLOADED', 'CHECKLIST_SUBMITTED', 'REWORK_REQUIRED', 'STARTED'];
    
    assertSurveyNotFinalized(survey);
    if (!allowedStatuses.includes(survey.survey_status)) {
        throw { statusCode: 400, message: `Please upload all required evidence proofs before submitting the survey report.` };
    }

    const checklistCount = await ActivityPlanning.count({ where: { job_certificate_id: survey.job_certificate_id }, useMaster: true });
    if (checklistCount === 0) {
        throw { statusCode: 400, message: 'Please complete the inspection checklist before submitting the final report.' };
    }

    if (!survey.signed_checklist_files || !Array.isArray(survey.signed_checklist_files) || survey.signed_checklist_files.length === 0) {
        throw { statusCode: 400, message: 'Please upload the filled and signed checklist document before submitting the survey report.' };
    }

    const rejectedItems = await ActivityPlanning.count({ where: { job_certificate_id: survey.job_certificate_id, status: 'REJECTED' }, useMaster: true });
    if (rejectedItems > 0) {
        throw { statusCode: 400, message: `Cannot submit report: ${rejectedItems} checklist items are still marked as REJECTED. Please correct them first.` };
    }

    const rejectedFiles = (survey.signed_checklist_files || []).filter(f => f.status === 'REJECTED');
    if (rejectedFiles.length > 0) {
        throw { statusCode: 400, message: `Cannot submit report: ${rejectedFiles.length} signed documents are still marked as REJECTED. Please re-upload them first.` };
    }

    // ── Compliance Enforcement: GPS & Photo ──
    if (submit_latitude == null || submit_longitude == null) {
        throw { statusCode: 400, message: "GPS location must be recorded onsite before submission." };
    }

    const photoFile = files?.photo?.[0];
    const signatureFile = files?.signature?.[0];

    // Assuming we use the first survey's photo/signature if not provided
    let photoUrl = survey.attendance_photo_url;
    if (data.photoKey) {
        photoUrl = data.photoKey;
    } else if (photoFile) {
        photoUrl = s3Service.generateKey(photoFile.originalname, s3Service.UPLOAD_FOLDERS.SURVEYS_PHOTO);
        s3Service.uploadFile(photoFile.buffer, photoFile.originalname, photoFile.mimetype, '', photoUrl)
            .catch(err => logger.error('Background S3 upload error (photo):', err));
    }

    if (!photoUrl) {
        throw { statusCode: 400, message: "Attendance photo is mandatory before submitting survey." };
    }

    let signatureUrl = survey.signature_url;
    if (data.signatureKey) {
        signatureUrl = data.signatureKey;
    } else if (signatureFile) {
        signatureUrl = s3Service.generateKey(signatureFile.originalname, s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF);
        s3Service.uploadFile(signatureFile.buffer, signatureFile.originalname, signatureFile.mimetype, '', signatureUrl)
            .catch(err => logger.error('Background S3 upload error (signature):', err));
    }

    const txn = await db.sequelize.transaction();
    try {
        // 1. Initial update of report fields
        await survey.update({
            submit_latitude,
            submit_longitude,
            attendance_photo_url: photoUrl,
            signature_url: signatureUrl,
            survey_statement
        }, { transaction: txn });

        // 2. Advance status (updates submission_count, declared_by, declared_at)
        await lifecycleService.updateSurveyStatus(survey.id, 'SUBMITTED', userId, 'Survey report submitted', { transaction: txn, _skipJobSync: true });

        // 4. Generate Declaration Hash
        const checklistData = await ActivityPlanning.findAll({
            where: { job_certificate_id: survey.job_certificate_id },
            attributes: ['question_code', 'question_text', 'answer', 'remarks', 'file_url'],
            transaction: txn
        });

        const hashPayload = JSON.stringify({
            survey_statement: survey.survey_statement,
            checklist_data: checklistData,
            evidence_proof_url: survey.evidence_proof_url,
            submit_latitude: survey.submit_latitude,
            submit_longitude: survey.submit_longitude,
            declared_at: survey.declared_at,
            submission_count: survey.submission_count
        });

        const declarationHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
        await survey.update({ declaration_hash: declarationHash }, { transaction: txn });

        // ── Job sync: check whether ALL survey-required certs are done after this submission ──
        // Uses checkStatus() trick identical to lifecycle's own auto-sync so the current
        // survey's new 'SUBMITTED' state is guaranteed to be visible even within this txn.
        const jobCerts = await db.JobCertificate.findAll({ where: { job_request_id: job_id }, transaction: txn });

        // Only count certificates that require a survey
        const surveyCertIds = [];
        for (const cert of jobCerts) {
            const certType = await db.CertificateType.findByPk(cert.certificate_type_id, { transaction: txn });
            if (!certType || certType.requires_survey !== false) {
                surveyCertIds.push(cert.id);
            }
        }

        const activeSurveys = await Survey.findAll({ where: { job_certificate_id: surveyCertIds }, transaction: txn });

        // checkStatus: for the survey just updated in this txn, use 'SUBMITTED' explicitly.
        const checkSurveyStatus = (s) => (s.id === survey.id ? 'SUBMITTED' : s.survey_status);

        const allSubmitted = activeSurveys.length > 0 &&
            activeSurveys.every(s => ['SUBMITTED', 'FINALIZED'].includes(checkSurveyStatus(s)));

        const jobReq = await db.JobRequest.findByPk(job_id, { transaction: txn });

        if (allSubmitted) {
            // All surveys done — move to SURVEY_DONE.
            // Works for first submission (IN_PROGRESS → SURVEY_DONE) AND
            // rework re-submission (REWORK_REQUESTED → SURVEY_DONE).
            if (!['SURVEY_DONE', 'REVIEWED', 'FINALIZED', 'CERTIFIED'].includes(jobReq.job_status)) {
                const syncReason = jobReq.job_status === 'REWORK_REQUESTED'
                    ? 'All rework surveys re-submitted — returning to SURVEY_DONE'
                    : 'All survey reports submitted';
                await lifecycleService.updateJobStatus(job_id, 'SURVEY_DONE', userId, syncReason, { transaction: txn, _skipSurveySync: true });
            }
        }
        // If NOT allSubmitted and job is REWORK_REQUESTED, it correctly stays REWORK_REQUESTED
        // until the remaining rework certs are also re-submitted by the surveyor.

        // 5. Log final GPS (only when coords provided) - log once per certificate submission
        if (submit_latitude && submit_longitude) {
            await GpsTracking.create({ surveyor_id: userId, job_id, job_certificate_id: jobCertificateId, latitude: submit_latitude, longitude: submit_longitude }, { transaction: txn });
        }

        await txn.commit();
        logger.info({ entity: 'SURVEY', event: 'SUBMITTED', jobCertificateId, jobId: job_id, triggeredBy: userId });

        // Notify ADMIN/TM/TO only when job is fully SURVEY_DONE
        if (allSubmitted) {
            const jobWithVessel = await db.JobRequest.findByPk(job_id, { include: ['Vessel'], useMaster: true });
            notificationService.notifyRoles(['ADMIN', 'TM', 'TO'], 'SURVEY_SUBMITTED', {
                jobId: job_id, vesselName: jobWithVessel?.Vessel?.vessel_name
            }).catch(() => { });
        }

        // Return updated survey
        return await Survey.findByPk(survey.id);
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// FINALIZE — TM / ADMIN Action
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TM/ADMIN action.
 * Survey must be SUBMITTED.
 * No open Non-Conformities (checked inside lifecycle.service).
 */
export const finalizeSurvey = async (jobId, user) => {
    if (!['TM', 'ADMIN'].includes(user.role)) {
        throw { statusCode: 403, message: 'Only Technical Managers (TM) or Admins have permission to finalize surveys.' };
    }
    const userId = user.id;
    await assertJobAccessible(jobId, userId, { checkSurveyor: false });

    const jobCerts = await db.JobCertificate.findAll({
        where: { job_request_id: jobId },
        include: [{ model: db.CertificateType, attributes: ['id', 'requires_survey'] }],
        useMaster: true
    });
    if (!jobCerts.length) throw { statusCode: 404, message: 'No certificates found for this job.' };

    const surveys = await Survey.findAll({ where: { job_certificate_id: jobCerts.map(c => c.id) }, useMaster: true });
    if (surveys.length === 0) throw { statusCode: 404, message: 'No survey found for this job.' };

    const submittedSurveys = surveys.filter(s => s.survey_status === 'SUBMITTED');
    if (submittedSurveys.length === 0) {
        throw { statusCode: 400, message: 'No submitted surveys found to finalize.' };
    }

    const pendingStatements = submittedSurveys.filter(s => s.survey_statement_status !== 'ISSUED');
    if (pendingStatements.length > 0) {
        throw { statusCode: 400, message: 'Cannot finalize: all submitted surveys must have issued statements first.' };
    }

    const txn = await db.sequelize.transaction();
    try {
        for (const survey of submittedSurveys) {
            await lifecycleService.updateSurveyStatus(survey.id, 'FINALIZED', userId, `Final approval granted by ${user.role}`, { transaction: txn });
            // NOTE: JobCertificate intentionally stays at SURVEY_DONE after finalization.
            // The GM must explicitly generate + issue the physical certificate
            // (POST /certificates then POST /certificates/:id/issue) to advance to ISSUED.
        }
        await txn.commit();
    } catch (error) {
        await txn.rollback();
        throw error;
    }

    const job = await JobRequest.findByPk(jobId, { include: ['Vessel'], useMaster: true });
    if (job?.assigned_surveyor_id) {
        notificationService.sendNotification(job.assigned_surveyor_id, 'JOB_FINALIZED', {
            vesselName: job.Vessel?.vessel_name
        }).catch(() => { });
    }

    // Refresh surveys after update
    const allSurveys = await Survey.findAll({ where: { job_certificate_id: jobCerts.map(c => c.id) }, useMaster: true });
    const surveyRequiredCerts = jobCerts.filter(c => !c.CertificateType || c.CertificateType.requires_survey !== false);
    const allFinalized = surveyRequiredCerts.length > 0 && surveyRequiredCerts.every(c => {
        const s = allSurveys.find(sr => sr.job_certificate_id === c.id);
        return s && s.survey_status === 'FINALIZED';
    });

    return {
        message: allFinalized
            ? 'All surveys finalized. Job is now FINALIZED.'
            : 'Surveys finalized successfully.'
    };
};

export const finalizeSingleSurvey = async (jobCertificateId, user) => {
    if (!['TM', 'ADMIN'].includes(user.role)) {
        throw { statusCode: 403, message: 'Only Technical Managers (TM) or Admins have permission to finalize surveys.' };
    }
    const userId = user.id;

    const jc = await db.JobCertificate.findByPk(jobCertificateId, { useMaster: true });
    if (!jc) throw { statusCode: 404, message: 'Job Certificate not found' };

    await assertJobAccessible(jc.job_request_id, userId, { checkSurveyor: false });

    const survey = await requireSurvey(null, jobCertificateId);
    assertSurveyNotFinalized(survey);

    if (survey.survey_status !== 'SUBMITTED') {
        throw { statusCode: 400, message: 'Only submitted surveys can be finalized.' };
    }
    if (survey.survey_statement_status !== 'ISSUED') {
        throw { statusCode: 400, message: 'Survey statement must be ISSUED before finalization.' };
    }

    const txn = await db.sequelize.transaction();
    try {
        await lifecycleService.updateSurveyStatus(survey.id, 'FINALIZED', userId, `Final approval granted by ${user.role}`, { transaction: txn });
        await txn.commit();
    } catch (error) {
        await txn.rollback();
        throw error;
    }

    const job = await JobRequest.findByPk(jc.job_request_id, { include: ['Vessel'], useMaster: true });
    if (job?.assigned_surveyor_id) {
        notificationService.sendNotification(job.assigned_surveyor_id, 'JOB_FINALIZED', {
            vesselName: job.Vessel?.vessel_name
        }).catch(() => { });
    }

    // Check if all surveys for this job are finalized to notify/return status
    const jobCerts = await db.JobCertificate.findAll({
        where: { job_request_id: jc.job_request_id },
        include: [{ model: db.CertificateType, attributes: ['id', 'requires_survey'] }],
        useMaster: true
    });
    const allSurveys = await Survey.findAll({ where: { job_certificate_id: jobCerts.map(c => c.id) }, useMaster: true });
    const surveyRequiredCerts = jobCerts.filter(c => !c.CertificateType || c.CertificateType.requires_survey !== false);
    const allFinalized = surveyRequiredCerts.length > 0 && surveyRequiredCerts.every(c => {
        const s = allSurveys.find(sr => sr.job_certificate_id === c.id);
        return s && s.survey_status === 'FINALIZED';
    });

    return {
        success: true,
        message: allFinalized
            ? 'All surveys finalized. Job is now FINALIZED.'
            : 'Survey finalized successfully.',
        job_status: allFinalized ? 'FINALIZED' : job?.job_status
    };
};
// ─────────────────────────────────────────────────────────────────────────────
// REQUEST REWORK — TM / GM Action
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Allowed only when survey is SUBMITTED and job has not passed FINALIZED.
 */
export const requestRework = async (jobId, data, userId) => {
    const job = await assertJobAccessible(jobId, userId, { checkSurveyor: false });

    if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Rework cannot be requested when job is ${job.job_status}.` };
    }

    // We can accept an array of rejected_certificates
    const { rejected_certificates, reason } = data;

    if (!rejected_certificates || !Array.isArray(rejected_certificates) || rejected_certificates.length === 0) {
        throw { statusCode: 400, message: 'Please specify which certificates require rework (rejected_certificates array required).' };
    }

    const jobCerts = await db.JobCertificate.findAll({ 
        where: { id: rejected_certificates.map(r => r.job_certificate_id), job_request_id: jobId }, 
        useMaster: true 
    });

    if (jobCerts.length === 0) {
        throw { statusCode: 404, message: 'None of the specified certificates belong to this job.' };
    }

    const surveys = await Survey.findAll({ 
        where: { job_certificate_id: jobCerts.map(jc => jc.id) }, 
        useMaster: true 
    });

    let reworkTriggered = false;

    for (const jc of jobCerts) {
        const survey = surveys.find(s => s.job_certificate_id === jc.id);
        if (!survey) continue;

        if (!['SUBMITTED', 'REWORK_REQUIRED'].includes(survey.survey_status)) {
            continue; // Skip surveys that aren't submitted
        }

        const rejectData = rejected_certificates.find(r => r.job_certificate_id === jc.id);
        let finalReason = rejectData.reason || reason || 'Rework requested.';

        const rejectedItems = await ActivityPlanning.count({
            where: { job_certificate_id: jc.id, status: 'REJECTED' },
            useMaster: true
        });
        const surveySignedDocsRejected = await db.SurveySignedDocument.count({
            where: { survey_id: survey.id, status: 'REJECTED' },
            useMaster: true
        });
        const rejectedFiles = surveySignedDocsRejected + (survey.signed_checklist_files || []).filter(f => f.status === 'REJECTED').length;

        if (rejectedItems > 0 || rejectedFiles > 0) {
            finalReason = `Granular Rejection: ${rejectedItems} items and ${rejectedFiles} documents rejected. ${finalReason}`.trim();
        }

        await jc.update({ status: 'REWORK_REQUESTED', rework_remarks: finalReason });
        await lifecycleService.updateSurveyStatus(survey.id, 'REWORK_REQUIRED', userId, finalReason, { _skipJobSync: true });
        reworkTriggered = true;
    }

    if (!reworkTriggered) {
        throw { statusCode: 400, message: 'Could not trigger rework on any submitted surveys.' };
    }

    // Since AT LEAST ONE survey is REWORK_REQUIRED, the Job MUST go to REWORK_REQUESTED
    await lifecycleService.updateJobStatus(jobId, 'REWORK_REQUESTED', userId,
        `Rework required for some certificates. Job moved to REWORK_REQUESTED.`,
        { _skipSurveySync: true });

    const jobWithVessel = await JobRequest.findByPk(jobId, { include: ['Vessel'], useMaster: true });
    if (job.assigned_surveyor_id) {
        notificationService.sendNotification(job.assigned_surveyor_id, 'SURVEY_REWORK_REQUESTED', {
            jobId, vesselName: jobWithVessel.Vessel.vessel_name,
            reason: reason || 'Multiple certificates require rework.'
        }).catch(() => { });
    }

    return { message: 'Rework requested for selected certificates. Job moved to REWORK_REQUESTED.', job_status: 'REWORK_REQUESTED' };
};

import { buildSurveyReportHtml } from './templates/survey-report.template.js';
import * as certificatePdfService from '../../services/certificate-pdf.service.js';

import QRCode from 'qrcode';

/**
 * Internal: Generates a Survey Report PDF and uploads it to S3.
 * Automatically handles watermarking and QR codes.
 */
const generateSurveyReportPdf = async (survey, user) => {
    // Fetch Comprehensive Data via JobCertificate
    const jc = await db.JobCertificate.findByPk(survey.job_certificate_id, {
        include: [
            { 
                model: db.JobRequest, as: 'JobRequest',
                include: [
                    { model: db.Vessel, include: [{ model: db.FlagAdministration, as: 'FlagAdministration' }] },
                    { model: db.User, as: 'requester', attributes: ['name', 'email'] }
                ]
            }
        ],
        useMaster: true
    });
    const job = jc?.JobRequest;
    const surveyor = await User.findByPk(survey.surveyor_id, { attributes: ['name'], useMaster: true });
    // BUG FIX: Checklist scoped by job_certificate_id, not job_id
    const checklist = await ActivityPlanning.findAll({
        where: { job_certificate_id: survey.job_certificate_id },
        attributes: ['question_text', 'answer', 'remarks', 'file_url'],
        useMaster: true
    });

    const isIssued = survey.survey_statement_status === 'ISSUED';
    const resolvedSurvey = await fileAccessService.resolveEntity(survey, user);
    const resolvedChecklist = await fileAccessService.resolveEntity(checklist, user);

    const html = buildSurveyReportHtml({
        job,
        vessel: job?.Vessel,
        surveyor,
        survey: { ...resolvedSurvey, is_draft: !isIssued },
        checklist: resolvedChecklist,
        client: job?.requester
    });

    const fullHtml = certificatePdfService.wrapHtmlForPdf(html);
    const pdfBuffer = await certificatePdfService.htmlToPdfBuffer(fullHtml);

    const prefix = isIssued ? 'survey-report' : 'survey-draft';
    const fileName = `${prefix}-${survey.id.substring(0, 8)}.pdf`;

    const url = await s3Service.uploadFile(
        pdfBuffer,
        fileName,
        'application/pdf',
        s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF
    );
    return url;
};

export const draftSurveyStatement = async (jobId, data, user) => {
    const { job_certificate_id } = data || {};
    const job = await assertJobAccessible(jobId, user.id, { checkSurveyor: user.role === 'SURVEYOR', jobCertificateId: job_certificate_id });

    const allowedDraftStatuses = ['SURVEY_DONE', 'REVIEWED', 'FINALIZED', 'PAYMENT_DONE', 'CERTIFIED'];
    if (!allowedDraftStatuses.includes(job.job_status)) {
        throw { statusCode: 400, message: `Survey statement can only be drafted after the survey is done. Current job status: ${job.job_status}` };
    }
    // Get first survey for this job (or the one matching the certificate if provided)
    const survey = await requireSurvey(jobId, job_certificate_id);
    assertSurveyNotFinalized(survey);

    const isManagement = ['TM', 'ADMIN'].includes(user.role);
    const updateData = {};

    if (data.survey_statement) {
        updateData.survey_statement = data.survey_statement;
        updateData.survey_statement_status = 'DRAFTED';
    } else if (!isManagement) {
        throw { statusCode: 400, message: 'Survey statement text is required.' };
    }

    if (Object.keys(updateData).length > 0) {
        await survey.update(updateData);
    }

    // Guard: ensure all active surveys are SUBMITTED
    const surveys = await Survey.findAll({ where: { job_certificate_id: survey.job_certificate_id } });
    for (const s of surveys) {
        if (s.survey_status !== 'SUBMITTED') {
            throw { statusCode: 400, message: `All active surveys must be SUBMITTED before finalization. Found survey in ${s.survey_status} status.` };
        }
    }

    // Role-based PDF generation trigger (NON-BLOCKING)
    if (isManagement) {
        if (!survey.survey_statement && !updateData.survey_statement) {
            throw { statusCode: 400, message: 'No survey statement text found. Surveyor must provide findings first.' };
        }
        
        // FIRE AND FORGET: Start generation in background
        generateSurveyReportPdf(survey, user)
            .then(draftUrl => survey.update({ survey_statement_pdf_url: draftUrl }))
            .catch(err => logger.error('Background Draft PDF generation failed:', err));
    }

    return { 
        message: isManagement ? 'Draft request received. Report is being generated in background.' : 'Survey statement saved.', 
        status: 'DRAFTED'
    };
};

export const issueSurveyStatement = async (jobId, file, data, user) => {
    if (!['TM', 'ADMIN'].includes(user.role)) {
        throw { statusCode: 403, message: 'Only Technical Managers (TM) or Admins have permission to issue survey statements.' };
    }
    const userId = user.id;

    // NOTE: issueStatement is allowed even when job is CERTIFIED/FINALIZED
    // (issuing the statement is a post-finalization action). We only check the job exists.
    const job = await JobRequest.findByPk(jobId, { useMaster: true });
    if (!job) throw { statusCode: 404, message: 'Job not found.' };

    const allowedIssueStatuses = ['REVIEWED', 'FINALIZED', 'PAYMENT_DONE', 'CERTIFIED'];
    if (!allowedIssueStatuses.includes(job.job_status)) {
        throw { statusCode: 400, message: `Survey statement can only be issued after the job has been reviewed. Current job status: ${job.job_status}` };
    }

    const { job_certificate_id, statementFileKey } = data || {};
    const survey = await requireSurvey(jobId, job_certificate_id);

    let finalUrl = null;

    if (file) {
        // A: Binary file uploaded directly (multipart/form-data)
        finalUrl = s3Service.generateKey(file.originalname, s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF);
        s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, '', finalUrl)
            .catch(err => logger.error('Issue Statement File Upload Failed:', err));
    } else if (statementFileKey) {
        // B: Pre-uploaded S3 key passed via JSON body
        finalUrl = statementFileKey;
    } else if (survey.survey_statement) {
        // C: Automated promotion from drafted text (Background PDF generation)
        const updatedSurveyStatus = { survey_statement_status: 'ISSUED' };
        await survey.update(updatedSurveyStatus);
        
        generateSurveyReportPdf(survey, user)
            .then(url => survey.update({ survey_statement_pdf_url: url }))
            .catch(err => logger.error('Background Official PDF generation failed:', err));
    } else {
        throw { statusCode: 400, message: 'No survey statement has been drafted. Please provide a statementFileKey, upload a file, or draft a survey statement first.' };
    }

    // Update status immediately so UI changes
    if (finalUrl) {
        await survey.update({
            survey_statement_status: 'ISSUED',
            survey_statement_pdf_url: finalUrl
        });
    }

    return { 
        message: 'Issuance process started. The final report will be available shortly.', 
        status: 'ISSUED'
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY
// ─────────────────────────────────────────────────────────────────────────────

export const getTimeline = async (id, user) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.is_survey_required === false) {
        throw { statusCode: 400, message: "Survey not required for this job." };
    }


    // Get all surveys for this job via certificates
    const jobCerts = await db.JobCertificate.findAll({
        where: { job_request_id: id },
        include: [{ model: db.CertificateType, attributes: ['id', 'requires_survey'] }]
    });

    // Exclude certs that don't require a survey (e.g. AFS cert with requires_survey=false)
    const surveyCerts = jobCerts.filter(jc => jc.CertificateType?.requires_survey !== false);
    const certIds = surveyCerts.map(jc => jc.id);

    // GPS now tracked per certificate survey
    const gps = await GpsTracking.findAll({
        where: certIds.length > 0
            ? { [db.Sequelize.Op.or]: [{ job_id: id }, { job_certificate_id: certIds }] }
            : { job_id: id },
        attributes: ['id', 'job_id', 'job_certificate_id', 'surveyor_id', 'vessel_id', 'latitude', 'longitude', 'timestamp'],
        order: [['timestamp', 'ASC']]
    });

    if (certIds.length === 0) {
        return { job_id: id, gps_trace: gps, survey_details: [] };
    }

    const surveys = await Survey.findAll({
        where: { job_certificate_id: certIds },
        include: [
            {
                model: db.SurveyStatusHistory,
                as: 'SurveyStatusHistories',
                attributes: ['id', 'survey_id', 'previous_status', 'new_status', 'changed_by', 'reason', 'submission_iteration', 'createdAt']
            },
            {
                model: db.JobCertificate,
                include: [{ model: db.CertificateType, attributes: ['id', 'name'] }]
            }
        ],
        order: [[{ model: db.SurveyStatusHistory, as: 'SurveyStatusHistories' }, 'created_at', 'ASC']]
    });
    return { job_id: id, gps_trace: gps, survey_details: await fileAccessService.resolveEntity(surveys, { id: user?.id }) };
};

export const getSurveyReports = async (query, user) => {
    const { page = 1, limit = 10, search, ...filters } = query;
    const allowedFilters = {};
    if (filters.survey_status) allowedFilters.survey_status = filters.survey_status;
    if (filters.surveyor_id) allowedFilters.surveyor_id = filters.surveyor_id;

    if (user?.role === 'SURVEYOR') {
        allowedFilters.surveyor_id = user.id;
    }

    const jobRequestWhere = {};
    if (filters.job_id) {
        jobRequestWhere.id = filters.job_id;
    }
    
    if (search || filters.job_number) {
        const term = search || filters.job_number;
        jobRequestWhere.job_request_number = { [db.Sequelize.Op.like]: `%${term}%` };
    }

    const { count, rows } = await Survey.findAndCountAll({
        where: allowedFilters,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        attributes: [
            'id', 'job_certificate_id', 'surveyor_id', 'survey_status', 'submission_count',
            'started_at', 'submitted_at', 'finalized_at', 'survey_statement_status', 'survey_statement_pdf_url'
        ],
        include: [
            {
                model: db.JobCertificate,
                required: true,
                include: [{
                    model: JobRequest,
                    where: jobRequestWhere,
                    required: true,
                    attributes: ['id', 'job_status', 'job_request_number'],
                    include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }]
                }]
            },
            { model: db.User, attributes: ['name', 'email'] }
        ],
        order: [['submitted_at', 'DESC']],
        useReplica: true
    });
    const statusCountWhere = { ...allowedFilters };
    delete statusCountWhere.survey_status;
    const statusCounts = await Survey.findAll({
        where: statusCountWhere,
        include: filters.job_id ? [{
            model: db.JobCertificate,
            required: true,
            include: [{
                model: JobRequest,
                where: { id: filters.job_id },
                required: true
            }]
        }] : [],
        attributes: [
            ['survey_status', 'status'],
            [db.sequelize.fn('COUNT', db.sequelize.col('survey_status')), 'count']
        ],
        group: ['survey_status'],
        raw: true,
        useReplica: true
    });

    return {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        status_counts: buildFullStatusCounts(statusCounts, SURVEY_STATUSES),
        rows: (await fileAccessService.resolveEntity(rows, { id: user?.id })).map(flatSurveyReportListRow),
    };
};

export const getSurveyDetails = async (jobId, user) => {
    // Support fetching by job_certificate_id or job_id
    const jobCerts = await db.JobCertificate.findAll({
        where: { job_request_id: jobId },
        include: [{ model: db.CertificateType, attributes: ['id', 'requires_survey'] }]
    });
    let surveyCerts = jobCerts.filter(jc => jc.CertificateType?.requires_survey !== false);
    if (user?.role === 'SURVEYOR') {
        surveyCerts = surveyCerts.filter(jc => jc.assigned_surveyor_id === user.id);
    }
    if (!surveyCerts.length) return [];

    const surveys = await Survey.findAll({
        where: { job_certificate_id: surveyCerts.map(jc => jc.id) },
        include: [
            { model: db.JobCertificate, include: [{ model: db.CertificateType, attributes: ['name'] }] },
            { model: db.User, attributes: ['name', 'email'] },
            { model: db.User, as: 'Declarer', attributes: ['name', 'email'] },
            { model: db.SurveyStatusHistory, attributes: ['previous_status', 'new_status', 'reason', 'createdAt'] }
        ],
        order: [[db.SurveyStatusHistory, 'createdAt', 'ASC']]
    });

    // Return empty array if no surveys yet (job may be newly ASSIGNED/AUTHORIZED)
    if (!surveys.length) return [];

    const resolved = await fileAccessService.resolveEntity(surveys, { id: user?.id });
    // Strip the SHA-256 integrity hash — kept in DB for audit but never exposed via API
    return resolved.map(s => {
        if (s && typeof s === 'object') {
            const { declaration_hash, ...rest } = s.get ? s.get({ plain: true }) : s;
            return rest;
        }
        return s;
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// STREAM GPS LOCATION — during active survey
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Records a live GPS ping from the surveyor during an active survey.
 * Can be called repeatedly throughout the inspection.
 */
export const streamLocation = async (jobId, { latitude, longitude, job_certificate_id }, userId) => {
    const job = await JobRequest.findByPk(jobId, { useMaster: true });
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    let isAssigned = false;
    if (job_certificate_id) {
        const jc = await db.JobCertificate.findByPk(job_certificate_id, { useMaster: true });
        if (jc && jc.assigned_surveyor_id === userId) {
            isAssigned = true;
        }
    }
    if (!isAssigned) {
        if (job.assigned_surveyor_id === userId) {
            isAssigned = true;
        } else {
            const count = await db.JobCertificate.count({
                where: { job_request_id: jobId, assigned_surveyor_id: userId },
                useMaster: true
            });
            if (count > 0) {
                isAssigned = true;
            }
        }
    }
    if (!isAssigned) {
        throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
    }

    if (job.is_survey_required === false) {
        throw { statusCode: 400, message: "Survey not required for this job." };
    }

    // Find any active survey for this job
    const jobCerts = await db.JobCertificate.findAll({ where: { job_request_id: jobId }, useMaster: true });
    const activeStatuses = ['STARTED', 'CHECKLIST_SUBMITTED', 'PROOF_UPLOADED', 'REWORK_REQUIRED'];
    const survey = await Survey.findOne({
        where: { 
            job_certificate_id: job_certificate_id || { [db.Sequelize.Op.in]: jobCerts.map(jc => jc.id) }, 
            survey_status: { [db.Sequelize.Op.in]: activeStatuses } 
        },
        useMaster: true
    });

    if (!survey) {
        throw { statusCode: 400, message: 'GPS tracking is only available during an active survey inspection.' };
    }

    const record = await GpsTracking.create({ surveyor_id: userId, job_id: jobId, job_certificate_id: survey.job_certificate_id, latitude, longitude });
    return record;
};


// ─────────────────────────────────────────────────────────────────────────────
// HYBRID FLOW — Signed Checklist Uploads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a pre-signed URL for the surveyor to upload a signed checklist scan.
 */
export const getSignedChecklistUploadUrl = async (jobId, fileName, contentType, userId, jobCertificateId = null) => {
    await assertJobAccessible(jobId, userId, { checkSurveyor: true, jobCertificateId });

    // BUG FIX: Scope key to job_certificate_id so concurrent cert uploads don't overwrite each other
    const certSegment = jobCertificateId ? jobCertificateId : jobId;
    const key = `surveys/signed-checklists/${certSegment}/${Date.now()}_${fileName}`;
    const signedUrl = await s3Service.getUploadSignedUrl(key, contentType);

    return {
        uploadUrl: signedUrl,
        fileKey: key,
    };
};

/**
 * Saves the array of S3 keys for the signed checklist scans.
 */
export const updateSignedChecklist = async (jobId, fileKeys, userId, jobCertificateId = null) => {
    if (!Array.isArray(fileKeys)) {
        throw { statusCode: 400, message: 'fileKeys must be an array of S3 keys strings.' };
    }

    await assertJobAccessible(jobId, userId, { checkSurveyor: true, jobCertificateId });

    const survey = await requireSurvey(jobId, jobCertificateId);
    assertSurveyNotFinalized(survey);

    const txn = await db.sequelize.transaction();
    try {
        await survey.update({ signed_checklist_files: fileKeys }, { transaction: txn });

        // If survey was in STARTED, move it to CHECKLIST_SUBMITTED (logical equivalent for hybrid)
        if (survey.survey_status === 'STARTED') {
             await lifecycleService.updateSurveyStatus(survey.id, 'CHECKLIST_SUBMITTED', userId, 'Hybrid signed checklist uploaded', { transaction: txn });
        }

        await txn.commit();
        return await fileAccessService.resolveEntity(survey, { id: userId });
    } catch (error) {
        if (!txn.finished) await txn.rollback();
        throw error;
    }
};

export const flagViolation = async (jobId, userId) => {
    await assertJobAccessible(jobId, userId, { checkSurveyor: false });
    notificationService.notifyRoles(['ADMIN', 'TM', 'GM'], 'Survey Violation Flagged',
        `Suspicious behavior flagged for Job ${jobId}.`, 'CRITICAL');
    await AuditLog.create({
        user_id: userId, action: 'FLAG_VIOLATION',
        entity_name: 'JobRequest', entity_id: jobId,
        new_values: { violation_flagged: true }
    });
    return { message: 'Violation flagged and admins notified.' };
};

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE SYNC — Batch replay field-captured data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SURVEYOR action.
 * Accepts a batched payload captured offline (checklist answers, GPS points).
 * Re-plays all items inside a single transaction for atomicity.
 *
 * Payload shape:
 * {
 *   checklist: [{ question_code, question_text, answer, remarks }],
 *   gps_points: [{ latitude, longitude, captured_at }]
 * }
 */
export const syncOfflineData = async (jobId, { checklist = [], gps_points = [], job_certificate_id = null }, userId) => {
    // Guard: job must be accessible and surveyor must match
    const job = await assertJobAccessible(jobId, userId, {
        checkSurveyor: true,
        allowedStatuses: ['SURVEY_AUTHORIZED', 'IN_PROGRESS', 'SURVEY_DONE'],
        jobCertificateId: job_certificate_id
    });

    const survey = await requireSurvey(jobId, job_certificate_id);
    assertSurveyNotFinalized(survey);

    const txn = await db.sequelize.transaction();
    try {
        // 1. Upsert checklist answers (ActivityPlanning rows)
        let checklistSynced = 0;
        if (checklist.length > 0) {
            for (const item of checklist) {
                // BUG FIX: ActivityPlanning must be scoped by job_certificate_id (not job_id)
                await ActivityPlanning.upsert({
                    job_id: jobId,
                    job_certificate_id: survey.job_certificate_id,
                    question_code: item.question_code,
                    question_text: item.question_text,
                    answer: item.answer,
                    remarks: item.remarks || null
                }, { transaction: txn });
            }
            checklistSynced = checklist.length;
        }

        // 2. Bulk create GPS points (historical replay)
        let gpsSynced = 0;
        if (gps_points.length > 0) {
            const gpsRows = gps_points.map(p => ({
                surveyor_id: userId,
                job_id: jobId,
                job_certificate_id: survey.job_certificate_id,
                latitude: p.latitude,
                longitude: p.longitude,
                timestamp: p.captured_at ? new Date(p.captured_at) : new Date()
            }));
            await GpsTracking.bulkCreate(gpsRows, { transaction: txn });
            gpsSynced = gps_points.length;
        }

        await txn.commit();

        logger.info({
            entity: 'SURVEY',
            event: 'OFFLINE_SYNC',
            jobId,
            surveyId: survey.id,
            checklistSynced,
            gpsSynced,
            triggeredBy: userId
        });

        return {
            message: 'Offline data synced successfully.',
            synced: {
                checklist_items: checklistSynced,
                gps_points: gpsSynced
            }
        };
    } catch (error) {
        if (!txn.finished) await txn.rollback();
        throw error;
    }
};
