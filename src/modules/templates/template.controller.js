import * as templateService from './template.service.js';

export const createTemplate = async (req, res, next) => {
    try {
        const template = await templateService.createTemplate(req.body);
        res.status(201).json({ message: 'Template created', template });
    } catch (error) {
        next(error);
    }
};

export const getTemplates = async (req, res, next) => {
    try {
        const templates = await templateService.getTemplates(req.query);
        res.json({ templates });
    } catch (error) {
        next(error);
    }
};

export const getTemplateById = async (req, res, next) => {
    try {
        const template = await templateService.getTemplateById(req.params.id);
        res.json({ template });
    } catch (error) {
        next(error);
    }
};

export const updateTemplate = async (req, res, next) => {
    try {
        const template = await templateService.updateTemplate(req.params.id, req.body);
        res.json({ message: 'Template updated', template });
    } catch (error) {
        next(error);
    }
};

export const deleteTemplate = async (req, res, next) => {
    try {
        const result = await templateService.deleteTemplate(req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
