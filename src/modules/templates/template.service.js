import db from '../../models/index.js';
import * as fileAccessService from '../../services/fileAccess.service.js';

const { CertificateTemplate } = db;

const scanHtmlTags = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return [];
    const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}|\{\s*([a-zA-Z0-9_.-]+)\s*\}/g;
    const tags = new Set();
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
        const val = match[1] || match[2];
        if (val) tags.add(val);
    }
    return Array.from(tags);
};

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

    const scannedTags = scanHtmlTags(data.template_content);
    data.variables = Array.from(new Set([...(data.variables || []), ...scannedTags]));

    const template = await CertificateTemplate.create({
        template_name: data.template_name,
        certificate_type_id: data.certificate_type_id,
        certificate_term: data.certificate_term ?? null,
        template_content: data.template_content,
        variables: data.variables || [],
        is_active: activeStatus
    });
    return await fileAccessService.resolveEntity(template);
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

    if (data.template_content) {
        const scannedTags = scanHtmlTags(data.template_content);
        data.variables = Array.from(new Set([...(data.variables || template.variables || []), ...scannedTags]));
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
