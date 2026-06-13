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
        const template = await checklistTemplateService.getChecklistTemplateForJob(req.params.jobId, req.query.job_certificate_id);
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
 * Download an auto-filled checklist DOCX for a job (generated + cached)
 */
export const downloadChecklistTemplateForJob = async (req, res, next) => {
    try {
        const force = String(req.query.force || '').toLowerCase() === 'true';
        const data = await checklistTemplateService.downloadChecklistTemplateForJob(req.params.jobId, req.user, { force, jobCertificateId: req.query.job_certificate_id });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a pre-signed URL for uploading a checklist template PDF
 */
export const getUploadUrl = async (req, res, next) => {
    try {
        const { fileName, contentType } = req.query;
        if (!fileName || !contentType) {
            return res.status(400).json({ success: false, message: 'fileName and contentType are required' });
        }
        const data = await checklistTemplateService.getUploadUrl(fileName, contentType, req.user.id);
        res.json({
            success: true,
            data
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

