import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';

const { CertificateTemplate } = db;

export const createTemplate = async (data) => {
    const activeStatus = data.is_active !== false;
    if (activeStatus) {
        const existing = await CertificateTemplate.findOne({
            where: {
                certificate_type_id: data.certificate_type_id,
                certificate_term: data.certificate_term || null,
                is_active: true
            }
        });
        if (existing) {
            throw {
                statusCode: 400,
                message: `An active template already exists for certificate type and term ${data.certificate_term || 'default'}.`
            };
        }
    }

    const template = await CertificateTemplate.create({
        template_name: data.template_name,
        certificate_type_id: data.certificate_type_id,
        certificate_term: data.certificate_term ?? null,
        template_file_url: data.template_file_url,
        variables: data.variables || [],
        is_active: activeStatus
    });
    return await fileAccessService.resolveEntity(template);
};

/**
 * Generate a pre-signed S3 PUT URL so admin can upload a certificate
 * template DOCX directly to S3. The returned `fileKey` should then be sent
 * back as `template_file_url` on
 *   POST /api/v1/certificate-templates  (create)
 *   PUT  /api/v1/certificate-templates/:id  (update)
 */
export const getUploadUrl = async (fileName, contentType) => {
    const key = `certificate-templates/${Date.now()}_${fileName}`;
    const uploadUrl = await s3Service.getUploadSignedUrl(key, contentType);
    return { uploadUrl, fileKey: key };
};

export const getTemplates = async (filters = {}) => {
    const where = {};
    if (filters.is_active !== undefined) where.is_active = filters.is_active;
    if (filters.certificate_type_id) where.certificate_type_id = filters.certificate_type_id;
    if (filters.certificate_term) where.certificate_term = filters.certificate_term;

    const templates = await CertificateTemplate.findAll({
        where,
        include: ['CertificateType'],
        useReplica: true
    });
    return await fileAccessService.resolveEntity(templates);
};

export const getTemplateById = async (id) => {
    const template = await CertificateTemplate.findByPk(id, {
        include: ['CertificateType']
    });
    if (!template) throw { statusCode: 404, message: 'Template not found' };
    return await fileAccessService.resolveEntity(template);
};

export const updateTemplate = async (id, data) => {
    const template = await CertificateTemplate.findByPk(id, { useMaster: true });
    if (!template) throw { statusCode: 404, message: 'Template not found' };

    const activeStatus = data.is_active !== undefined ? data.is_active : template.is_active;
    const term = data.certificate_term !== undefined ? data.certificate_term : template.certificate_term;
    const typeId = data.certificate_type_id !== undefined ? data.certificate_type_id : template.certificate_type_id;

    if (activeStatus) {
        const existing = await CertificateTemplate.findOne({
            where: {
                id: { [db.Sequelize.Op.ne]: id },
                certificate_type_id: typeId,
                certificate_term: term || null,
                is_active: true
            }
        });
        if (existing) {
            throw {
                statusCode: 400,
                message: `An active template already exists for certificate type and term ${term || 'default'}.`
            };
        }
    }

    const updated = await template.update(data);
    return await fileAccessService.resolveEntity(updated);
};

export const deleteTemplate = async (id) => {
    const template = await CertificateTemplate.findByPk(id, { useMaster: true });
    if (!template) throw { statusCode: 404, message: 'Template not found' };

    await template.destroy();
    return { message: 'Template deleted successfully' };
};
