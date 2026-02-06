
import db from '../../models/index.js';

const ChecklistTemplate = db.ChecklistTemplate;

export const createTemplate = async (data, user) => {
    // Check if code exists
    const existing = await ChecklistTemplate.findOne({ where: { code: data.code } });
    if (existing) {
        throw { statusCode: 400, message: `Template with code ${data.code} already exists.` };
    }

    const template = await ChecklistTemplate.create({
        ...data,
        created_by: user.id,
        updated_by: user.id
    });

    return template;
};

export const getTemplates = async (query = {}) => {
    const { status, type, page = 1, limit = 10 } = query;
    const where = {};

    if (status) where.status = status;
    // Assuming 'type' or other metadata usage in future, currently filtering by status is generic.

    const templates = await ChecklistTemplate.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']],
        include: [
            { model: db.User, as: 'Creator', attributes: ['id', 'name'] }
        ]
    });

    return templates;
};

export const getTemplateById = async (id) => {
    const template = await ChecklistTemplate.findByPk(id, {
        include: [
            { model: db.User, as: 'Creator', attributes: ['id', 'name'] },
            { model: db.User, as: 'Updater', attributes: ['id', 'name'] }
        ]
    });

    if (!template) {
        throw { statusCode: 404, message: 'Template not found' };
    }
    return template;
};

export const updateTemplate = async (id, data, user) => {
    const template = await getTemplateById(id);

    // If updating code, check uniqueness
    if (data.code && data.code !== template.code) {
        const existing = await ChecklistTemplate.findOne({ where: { code: data.code } });
        if (existing) {
            throw { statusCode: 400, message: `Template with code ${data.code} already exists.` };
        }
    }

    await template.update({
        ...data,
        updated_by: user.id
    });

    return template;
};

export const deleteTemplate = async (id) => {
    const template = await getTemplateById(id);
    await template.destroy();
    return { message: 'Template deleted successfully' };
};
