import * as checklistTemplateService from './checklist_template.service.js';

/**
 * Create a new checklist template
 */
export const createChecklistTemplate = async (req, res, next) => {
    try {
        const template = await checklistTemplateService.createChecklistTemplate(req.body, req.user.id);
        res.status(201).json({
            success: true,
            message: 'Checklist template created successfully',
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all checklist templates
 */
export const getChecklistTemplates = async (req, res, next) => {
    try {
        const templates = await checklistTemplateService.getChecklistTemplates(req.query);
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a specific checklist template by ID
 */
export const getChecklistTemplateById = async (req, res, next) => {
    try {
        const template = await checklistTemplateService.getChecklistTemplateById(req.params.id);
        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get checklist template for a specific job
 * This is what surveyors use to know what questions to answer
 */
export const getChecklistTemplateForJob = async (req, res, next) => {
    try {
        const template = await checklistTemplateService.getChecklistTemplateForJob(req.params.jobId);
        res.json({
            success: true,
            data: template,
            message: 'Use this template to fill out the checklist for this job'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a checklist template
 */
export const updateChecklistTemplate = async (req, res, next) => {
    try {
        const template = await checklistTemplateService.updateChecklistTemplate(
            req.params.id,
            req.body,
            req.user.id
        );
        res.json({
            success: true,
            message: 'Checklist template updated successfully',
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a checklist template
 */
export const deleteChecklistTemplate = async (req, res, next) => {
    try {
        const result = await checklistTemplateService.deleteChecklistTemplate(req.params.id);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Activate a checklist template
 */
export const activateChecklistTemplate = async (req, res, next) => {
    try {
        const template = await checklistTemplateService.activateChecklistTemplate(
            req.params.id,
            req.user.id
        );
        res.json({
            success: true,
            message: 'Checklist template activated successfully',
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clone a checklist template
 */
export const cloneChecklistTemplate = async (req, res, next) => {
    try {
        const template = await checklistTemplateService.cloneChecklistTemplate(
            req.params.id,
            req.user.id
        );
        res.json({
            success: true,
            message: 'Checklist template cloned successfully',
            data: template
        });
    } catch (error) {
        next(error);
    }
};
