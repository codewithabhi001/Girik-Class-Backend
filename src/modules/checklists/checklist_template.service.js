import db from '../../models/index.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as s3Service from '../../services/s3.service.js';
import { fillDocxContentControls } from '../../utils/docxFill.util.js';
import { buildTagValuesForJob } from '../../utils/tagBuilder.util.js';

const ChecklistTemplate = db.ChecklistTemplate;
const CertificateType = db.CertificateType;
const JobRequest = db.JobRequest;
const Document = db.Document;

/**
 * Create a new checklist template
 */
export const createChecklistTemplate = async (data, userId) => {
    const txn = await db.sequelize.transaction();
    try {
        const template = await db.ChecklistTemplate.create({
            name: data.name,
            code: data.code,
            description: data.description,
            sections: data.sections,
            template_files: data.template_files || [], // keep JSON for backward compat
            certificate_type_id: data.certificate_type_id,
            status: data.status || 'DRAFT',
            metadata: data.metadata || {},
            created_by: userId,
            updated_by: userId
        }, { transaction: txn });

        // Also create ChecklistTemplateFile rows for each file key
        const fileKeys = Array.isArray(data.template_files) ? data.template_files : [];
        for (let i = 0; i < fileKeys.length; i++) {
            const key = fileKeys[i];
            const keyParts = key.split('/');
            const rawName = keyParts[keyParts.length - 1] || 'Document';
            const cleanName = rawName.replace(/^\d+_/, '');
            await db.ChecklistTemplateFile.create({
                checklist_template_id: template.id,
                name: cleanName,
                file_key: key,
                display_order: i,
                is_mandatory: true,
                created_by: userId
            }, { transaction: txn });
        }

        await txn.commit();
        return template;
    } catch (err) {
        await txn.rollback();
        throw err;
    }
};

/**
 * Get all checklist templates with optional filters
 */
export const getChecklistTemplates = async (filters = {}) => {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.certificate_type_id) where.certificate_type_id = filters.certificate_type_id;
    if (filters.code) where.code = filters.code;

    const templates = await ChecklistTemplate.findAll({
        where,
        attributes: { exclude: ['sections', 'metadata'] }, // Exclude heavy JSON fields for list view
        include: [
            {
                model: CertificateType,
                as: 'CertificateType',
                attributes: ['id', 'name', 'issuing_authority']
            },
            {
                model: db.User,
                as: 'Creator',
                attributes: ['id', 'name', 'email']
            },
            {
                model: db.ChecklistTemplateFile,
                as: 'TemplateFiles',
                attributes: ['id', 'name', 'description', 'file_key', 'display_order', 'is_mandatory'],
                order: [['display_order', 'ASC']]
            }
        ],
        order: [['created_at', 'DESC']]
    });

    return await fileAccessService.resolveEntity(templates);
};

/**
 * Get a specific checklist template by ID
 */
export const getChecklistTemplateById = async (id) => {
    const template = await ChecklistTemplate.findByPk(id, {
        include: [
            {
                model: CertificateType,
                as: 'CertificateType',
                attributes: ['id', 'name', 'issuing_authority', 'description']
            },
            {
                model: db.User,
                as: 'Creator',
                attributes: ['id', 'name', 'email']
            },
            {
                model: db.User,
                as: 'Updater',
                attributes: ['id', 'name', 'email']
            },
            {
                model: db.ChecklistTemplateFile,
                as: 'TemplateFiles',
                attributes: ['id', 'name', 'description', 'file_key', 'display_order', 'is_mandatory'],
                separate: true,
                order: [['display_order', 'ASC']]
            }
        ]
    });

    if (!template) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    return await fileAccessService.resolveEntity(template);
};

/**
 * Get checklist template for a specific job
 * This is what surveyors will use to know what questions to answer
 */
export const getChecklistTemplateForJob = async (jobId, jobCertificateId = null) => {
    const job = await JobRequest.findByPk(jobId, { useMaster: true });
    if (!job) {
        throw { statusCode: 404, message: 'Job not found' };
    }

    let certTypeId;

    if (jobCertificateId) {
        const jobCert = await db.JobCertificate.findByPk(jobCertificateId, { useMaster: true });
        if (jobCert && jobCert.job_request_id === jobId) {
            certTypeId = jobCert.certificate_type_id;
        }
    }

    if (!certTypeId) {
        const jobCert = await db.JobCertificate.findOne({
            where: { job_request_id: jobId },
            useMaster: true
        });
        certTypeId = jobCert?.certificate_type_id;
    }

    if (!certTypeId) {
        throw { statusCode: 400, message: 'No certificate linked to this job request.' };
    }

    // Find active checklist template for this certificate type
    const template = await ChecklistTemplate.findOne({
        where: {
            certificate_type_id: certTypeId,
            status: 'ACTIVE'
        },
        include: [
            {
                model: CertificateType,
                as: 'CertificateType',
                attributes: ['id', 'name', 'issuing_authority']
            },
            {
                model: db.ChecklistTemplateFile,
                as: 'TemplateFiles',
                attributes: ['id', 'name', 'description', 'file_key', 'display_order', 'is_mandatory'],
                separate: true,
                order: [['display_order', 'ASC']]
            }
        ]
    });

    if (!template) {
        const certType = await CertificateType.findByPk(certTypeId);
        throw {
            statusCode: 404,
            message: `No active checklist template found for certificate type: ${certType?.name || 'Unknown'}`
        };
    }

    return await fileAccessService.resolveEntity(template);
};


/**
 * Download a job-specific auto-filled checklist (DOCX), generate + cache in documents table.
 */
export const downloadChecklistTemplateForJob = async (jobId, user, { force = false, jobCertificateId = null } = {}) => {
    const job = await JobRequest.findByPk(jobId, {
        include: [
            { model: db.Vessel, include: [{ model: db.Client, as: 'Client' }] },
            { model: db.User, as: 'surveyor' },
        ],
        useMaster: true
    });
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    let certTypeId;
    
    if (jobCertificateId) {
        const jobCert = await db.JobCertificate.findByPk(jobCertificateId, { useMaster: true });
        if (jobCert && jobCert.job_request_id === jobId) {
            certTypeId = jobCert.certificate_type_id;
        }
    }

    if (!certTypeId) {
        const jobCert = await db.JobCertificate.findOne({
            where: { job_request_id: jobId },
            useMaster: true
        });
        certTypeId = jobCert?.certificate_type_id;
    }

    if (!certTypeId) {
        throw { statusCode: 400, message: 'No certificate linked to this job' };
    }

    // Find active template (raw keys, no resolveEntity here)
    const template = await ChecklistTemplate.findOne({
        where: { certificate_type_id: certTypeId, status: 'ACTIVE' },
    });
    if (!template) {
        throw { statusCode: 404, message: 'No active checklist template found for this job' };
    }

    const templateFiles = Array.isArray(template.template_files) ? template.template_files : [];
    if (templateFiles.length === 0) {
        throw { statusCode: 400, message: 'Checklist template has no template_files configured' };
    }

    const tagValues = await buildTagValuesForJob(jobId);
    const results = [];

    for (const templateKey of templateFiles) {
        const cacheDescription = `prefilled-checklist:${template.id}:${templateKey}`;
        let docRecord = null;

        if (!force) {
            const existing = await Document.findOne({
                where: {
                    entity_type: 'JOB',
                    entity_id: jobId,
                    document_type: 'CHECKLIST_PREFILLED',
                    description: cacheDescription,
                },
                order: [['uploaded_at', 'DESC']],
            });
            if (existing) {
                docRecord = existing.get({ plain: true });
            }
        }

        if (!docRecord) {
            // Fetch master docx, fill, upload, store Document
            const masterBuffer = await s3Service.getFileContent(templateKey);
            const filledBuffer = await fillDocxContentControls(masterBuffer, tagValues);

            // Give it a meaningful name from the original key or use template code
            const originalNameMatch = templateKey.match(/[^/]+$/);
            const baseFileName = originalNameMatch ? originalNameMatch[0].replace(/^[0-9]+-/, '') : `${template.code || template.id}.docx`;
            
            const outKey = `documents/jobs/${jobId}/checklists/${Date.now()}-${baseFileName}`;
            await s3Service.uploadFile(
                filledBuffer,
                baseFileName,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '',
                outKey
            );

            const doc = await Document.create({
                entity_type: 'JOB',
                entity_id: jobId,
                file_url: outKey,
                file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                document_type: 'CHECKLIST_PREFILLED',
                description: cacheDescription,
                uploaded_by: user?.id || null,
                uploaded_at: new Date(),
            });
            docRecord = doc.get({ plain: true });
        }

        const accessInfo = await fileAccessService.processFileAccess(docRecord, user);
        results.push(accessInfo);
    }

    // Return the array of signed documents!
    return results;
};

/**
 * Generate a pre-signed URL for uploading a checklist template PDF
 */
export const getUploadUrl = async (fileName, contentType, userId) => {
    const key = `checklist-templates/${Date.now()}_${fileName}`;
    const signedUrl = await s3Service.getUploadSignedUrl(key, contentType);

    return {
        uploadUrl: signedUrl,
        fileKey: key,
    };
};

/**
 * Update a checklist template.
 *
 * Accepts three independent ways to manage `template_files` (the array of
 * S3 keys for attached PDFs/DOCXs):
 *   1. `template_files`         — full replace
 *   2. `add_template_files`     — append these keys to the existing list
 *   3. `remove_template_files`  — drop these specific keys from the list
 *
 * `add_*` and `remove_*` may be combined in a single call, but cannot be
 * combined with the full-replace `template_files`.
 *
 * Structural edits (name / code / sections / certificate_type_id / metadata)
 * still require the template to be in DRAFT status — clone + version-bump
 * is the right path for finalized templates.  File-list ops (attach / detach
 * documents) are allowed at any status, since they only change which sample
 * documents are attached, not the actual checklist questions.
 */
export const updateChecklistTemplate = async (id, data, userId) => {
    const template = await ChecklistTemplate.findByPk(id, { useMaster: true });

    if (!template) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    const fileOnlyKeys = new Set(['template_files', 'add_template_files', 'remove_template_files']);
    const incomingKeys = Object.keys(data);
    const hasStructuralEdit = incomingKeys.some(k => !fileOnlyKeys.has(k));

    if (hasStructuralEdit && template.status !== 'DRAFT') {
        throw {
            statusCode: 400,
            message: 'Cannot modify a finalized Checklist Template. Please clone and version-increment instead. (Tip: attach/detach document files via template_files / add_template_files / remove_template_files — that is allowed at any status.)'
        };
    }

    // ── Compute the next template_files array ──────────────────────────────
    let nextTemplateFiles;
    const current = Array.isArray(template.template_files) ? [...template.template_files] : [];

    if (Array.isArray(data.template_files)) {
        // Full replace
        nextTemplateFiles = [...new Set(data.template_files)];
    } else if (Array.isArray(data.add_template_files) || Array.isArray(data.remove_template_files)) {
        const additions = Array.isArray(data.add_template_files) ? data.add_template_files : [];
        const removals = new Set(Array.isArray(data.remove_template_files) ? data.remove_template_files : []);
        // Keep order: existing keys that aren't being removed, then new keys.
        const kept = current.filter(k => !removals.has(k));
        const merged = [...kept];
        for (const k of additions) {
            if (!merged.includes(k)) merged.push(k);
        }
        nextTemplateFiles = merged;
    }

    // Strip the per-op virtual fields before sending to Sequelize.
    const { template_files: _tf, add_template_files: _atf, remove_template_files: _rtf, ...rest } = data;
    const updatePayload = { ...rest, updated_by: userId };
    if (nextTemplateFiles !== undefined) updatePayload.template_files = nextTemplateFiles;

    return await fileAccessService.resolveEntity(await template.update(updatePayload));
};

/**
 * Delete a checklist template (soft delete by setting status to INACTIVE)
 */
export const deleteChecklistTemplate = async (id) => {
    const template = await ChecklistTemplate.findByPk(id, { useMaster: true });

    if (!template) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    // Soft delete by setting status to INACTIVE
    await template.update({ status: 'INACTIVE' });

    return { message: 'Checklist template deleted successfully' };
};

/**
 * Activate a checklist template.
 *
 * Guards: an activated template must be *usable* by surveyors, otherwise
 * it would silently never match any job.  We therefore require:
 *   • a `certificate_type_id`   (so jobs of that cert type can match it)
 *   • at least one section with at least one item
 *
 * As a side effect, any other ACTIVE template for the same certificate type
 * is moved to INACTIVE — at most one ACTIVE template per certificate type.
 */
export const activateChecklistTemplate = async (id, userId) => {
    return await db.sequelize.transaction(async (t) => {
        const template = await ChecklistTemplate.findByPk(id, { transaction: t });

        if (!template) {
            throw { statusCode: 404, message: 'Checklist template not found' };
        }

        if (!template.certificate_type_id) {
            throw {
                statusCode: 400,
                message: 'Cannot activate a template that is not linked to a certificate type — it would never match any job. Set `certificate_type_id` first.'
            };
        }

        const sections = Array.isArray(template.sections) ? template.sections : [];
        const totalItems = sections.reduce(
            (sum, s) => sum + (Array.isArray(s?.items) ? s.items.length : 0),
            0
        );
        if (totalItems === 0) {
            throw {
                statusCode: 400,
                message: 'Cannot activate a template with no checklist items. Add at least one section + item before activating.'
            };
        }

        // Deactivate any other ACTIVE template for the same certificate type.
        await ChecklistTemplate.update(
            { status: 'INACTIVE', updated_by: userId },
            {
                where: {
                    certificate_type_id: template.certificate_type_id,
                    status: 'ACTIVE',
                    id: { [db.Sequelize.Op.ne]: id }
                },
                transaction: t
            }
        );

        return await template.update({
            status: 'ACTIVE',
            updated_by: userId
        }, { transaction: t });
    });
};

/**
 * Clone a checklist template.
 *
 * The clone:
 *   • keeps the same `name` (visually identifies it as the next version)
 *   • bumps `metadata.version` and appends `_Vx_y` to `code` for uniqueness
 *   • carries over `sections`, `certificate_type_id` and `template_files`
 *     so the cloned template starts off with the same questions AND the
 *     same attached reference DOCXs (admin can then swap docs / edit
 *     questions while still in DRAFT)
 *   • starts in DRAFT — admin must explicitly `PUT /:id/activate` it
 */
export const cloneChecklistTemplate = async (id, userId) => {
    const originalTemplate = await ChecklistTemplate.findByPk(id, { useMaster: true });

    if (!originalTemplate) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    const metadata = { ...(originalTemplate.metadata || {}) };

    // Strip existing _Vx_y suffix to get the clean base code
    const baseCode = originalTemplate.code.replace(/_V\d+_\d+$/, '');

    // Determine starting version number (current version + 1, or 2.0 if none)
    const currentVersion = parseFloat(metadata.version) || 1.0;
    let nextVersionNum = Math.floor(currentVersion) + 1; // Always bump the major version integer

    // Find a unique code by incrementing until no existing template uses it
    let newCode;
    let attempts = 0;
    while (true) {
        const candidateVersion = `${nextVersionNum}.0`;
        const candidateSuffix = `_V${candidateVersion.replace('.', '_')}`;
        const candidateCode = `${baseCode}${candidateSuffix}`;

        const existing = await ChecklistTemplate.findOne({
            where: { code: candidateCode },
            useMaster: true,
        });

        if (!existing) {
            newCode = candidateCode;
            metadata.version = candidateVersion;
            break;
        }

        nextVersionNum++;
        attempts++;

        // Safety: never loop infinitely
        if (attempts > 50) {
            throw { statusCode: 409, message: 'Could not generate a unique template code after 50 attempts.' };
        }
    }

    const newTemplate = await ChecklistTemplate.create({
        name: originalTemplate.name,
        code: newCode,
        description: originalTemplate.description,
        sections: originalTemplate.sections,
        template_files: Array.isArray(originalTemplate.template_files)
            ? [...originalTemplate.template_files]
            : [],
        certificate_type_id: originalTemplate.certificate_type_id,
        status: 'DRAFT',
        metadata: metadata,
        created_by: userId,
        updated_by: userId
    });

    return newTemplate;
};

