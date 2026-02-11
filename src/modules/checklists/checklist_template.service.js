import db from '../../models/index.js';

const ChecklistTemplate = db.ChecklistTemplate;
const CertificateType = db.CertificateType;
const JobRequest = db.JobRequest;

/**
 * Create a new checklist template
 */
export const createChecklistTemplate = async (data, userId) => {
    return await ChecklistTemplate.create({
        name: data.name,
        code: data.code,
        description: data.description,
        sections: data.sections,
        certificate_type_id: data.certificate_type_id,
        status: data.status || 'DRAFT',
        metadata: data.metadata || {},
        created_by: userId,
        updated_by: userId
    });
};

/**
 * Get all checklist templates with optional filters
 */
export const getChecklistTemplates = async (filters = {}) => {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.certificate_type_id) where.certificate_type_id = filters.certificate_type_id;
    if (filters.code) where.code = filters.code;

    return await ChecklistTemplate.findAll({
        where,
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
            }
        ],
        order: [['created_at', 'DESC']]
    });
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
            }
        ]
    });

    if (!template) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    return template;
};

/**
 * Get checklist template for a specific job
 * This is what surveyors will use to know what questions to answer
 */
export const getChecklistTemplateForJob = async (jobId) => {
    // Get job with certificate type
    const job = await JobRequest.findByPk(jobId, {
        include: ['CertificateType']
    });
    console.log(job);
    if (!job) {
        throw { statusCode: 404, message: 'Job not found' };
    }

    // Find active checklist template for this certificate type
    const template = await ChecklistTemplate.findOne({
        where: {
            certificate_type_id: job.certificate_type_id,
            status: 'ACTIVE'
        },
        include: [
            {
                model: CertificateType,
                as: 'CertificateType',
                attributes: ['id', 'name', 'issuing_authority']
            }
        ]
    });

    if (!template) {
        throw {
            statusCode: 404,
            message: `No active checklist template found for certificate type: ${job.CertificateType?.name || 'Unknown'}`
        };
    }

    return template;
};

/**
 * Update a checklist template
 */
export const updateChecklistTemplate = async (id, data, userId) => {
    const template = await ChecklistTemplate.findByPk(id);

    if (!template) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    return await template.update({
        ...data,
        updated_by: userId
    });
};

/**
 * Delete a checklist template (soft delete by setting status to INACTIVE)
 */
export const deleteChecklistTemplate = async (id) => {
    const template = await ChecklistTemplate.findByPk(id);

    if (!template) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    // Soft delete by setting status to INACTIVE
    await template.update({ status: 'INACTIVE' });

    return { message: 'Checklist template deleted successfully' };
};

/**
 * Activate a checklist template
 */
export const activateChecklistTemplate = async (id, userId) => {
    const template = await ChecklistTemplate.findByPk(id);

    if (!template) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    return await template.update({
        status: 'ACTIVE',
        updated_by: userId
    });
};

/**
 * Clone a checklist template
 */
export const cloneChecklistTemplate = async (id, userId) => {
    const originalTemplate = await ChecklistTemplate.findByPk(id);

    if (!originalTemplate) {
        throw { statusCode: 404, message: 'Checklist template not found' };
    }

    const newTemplate = await ChecklistTemplate.create({
        name: `${originalTemplate.name} (Copy)`,
        code: `${originalTemplate.code}_COPY_${Date.now()}`,
        description: originalTemplate.description,
        sections: originalTemplate.sections,
        certificate_type_id: originalTemplate.certificate_type_id,
        status: 'DRAFT',
        metadata: originalTemplate.metadata,
        created_by: userId,
        updated_by: userId
    });

    return newTemplate;
};
