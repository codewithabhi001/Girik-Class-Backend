import * as checklistService from './checklist.service.js';
import db from '../../models/index.js';

// GET /checklists/job-certificates/:jobCertificateId
export const getChecklist = async (req, res, next) => {
    try {
        const jc = await db.JobCertificate.findByPk(req.params.jobCertificateId);
        if (!jc) return res.status(404).json({ success: false, message: 'Job certificate not found' });
        const list = await checklistService.getChecklist(
            jc.job_request_id,
            { ...req.query, job_certificate_id: jc.id },
            req.user
        );
        res.json({ success: true, data: list });
    } catch (error) { next(error); }
};

// PUT /checklists/job-certificates/:jobCertificateId
// Body: { items, signed_checklist_files? }
export const submitChecklist = async (req, res, next) => {
    try {
        const jc = await db.JobCertificate.findByPk(req.params.jobCertificateId);
        if (!jc) return res.status(404).json({ success: false, message: 'Job certificate not found' });
        const list = await checklistService.submitChecklist(
            jc.job_request_id,
            req.body.items,
            req.user,
            req.body.signed_checklist_files,
            jc.id
        );
        res.json({ success: true, data: list });
    } catch (error) { next(error); }
};

// PUT /checklists/job-certificates/:jobCertificateId/signed-checklist-files
export const updateSignedChecklistFiles = async (req, res, next) => {
    try {
        const jc = await db.JobCertificate.findByPk(req.params.jobCertificateId);
        if (!jc) return res.status(404).json({ success: false, message: 'Job certificate not found' });
        const list = await checklistService.updateSignedChecklistFiles(
            jc.job_request_id,
            req.body.signed_checklist_files,
            req.user,
            jc.id
        );
        res.json({ success: true, data: list });
    } catch (error) { next(error); }
};

// GET /checklists/job-certificates/:jobCertificateId/get-upload-url
export const getUploadUrl = async (req, res, next) => {
    try {
        const { fileName, contentType } = req.query;
        if (!fileName || !contentType) {
            return res.status(400).json({ success: false, message: 'fileName and contentType are required query parameters.' });
        }
        const jc = await db.JobCertificate.findByPk(req.params.jobCertificateId);
        if (!jc) return res.status(404).json({ success: false, message: 'Job certificate not found' });
        const result = await checklistService.getSignedUploadUrl(
            jc.job_request_id, fileName, contentType, req.user.id, jc.id
        );
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

// GET /checklists/job-certificates/:jobCertificateId/signed-checklist-upload-url
export const getSignedChecklistUploadUrl = async (req, res, next) => {
    try {
        const { fileName, contentType } = req.query;
        if (!fileName || !contentType) {
            return res.status(400).json({ success: false, message: 'fileName and contentType are required query parameters.' });
        }
        const jc = await db.JobCertificate.findByPk(req.params.jobCertificateId);
        if (!jc) return res.status(404).json({ success: false, message: 'Job certificate not found' });
        const result = await checklistService.getSignedChecklistUploadUrl(
            jc.job_request_id, fileName, contentType, req.user.id, jc.id
        );
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

export const reviewChecklistItem = async (req, res, next) => {
    try {
        const result = await checklistService.reviewChecklistItem(
            req.params.jobId, req.params.itemId, req.body, req.user
        );
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

export const reviewSignedDocument = async (req, res, next) => {
    try {
        const result = await checklistService.reviewSignedDocument(
            req.params.jobId, req.params.fileIndex, req.body, req.user, req.body.job_certificate_id
        );
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};
