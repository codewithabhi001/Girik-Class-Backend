import * as jobService from './job.service.js';
import * as jobMessagingService from './job.messaging.service.js';
import * as documentService from '../documents/document.service.js';
import db from '../../models/index.js';

// ─────────────────────────────────────────────
// Scope Helpers
// ─────────────────────────────────────────────
const getScopeFilters = async (user) => {
    const scopeFilters = {};
    if (user.role === 'CLIENT') {
        const vessels = await db.Vessel.findAll({ where: { client_id: user.client_id }, attributes: ['id'] });
        scopeFilters.vessel_id = vessels.map(v => v.id);
    }
    // Surveyor scope: job row OR any JobCertificate.assigned_surveyor_id (handled in service)
    return scopeFilters;
};

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

export const getUploadUrl = async (req, res, next) => {
    try {
        const { fileName, fileType } = req.query;
        const folder = req.query.folder || 'jobs';

        if (!fileName || !fileType) {
            throw { statusCode: 400, message: 'fileName and fileType are required.' };
        }

        const data = await documentService.generatePresignedUrl(fileName, fileType, folder);
        
        // Mark as deprecated by sending warning header and deprecated metadata
        res.set('Warning', '299 - "GET /api/v1/jobs/upload-url is deprecated. Use GET /api/v1/documents/get-upload-url instead."');
        res.json({ 
            success: true, 
            deprecated: true,
            message: "Deprecated: Use GET /api/v1/documents/get-upload-url instead.",
            data 
        });
    } catch (e) { next(e); }
};
// ─────────────────────────────────────────────
export const createJob = async (req, res, next) => {
    try {
        let job;
        if (req.user.role === 'CLIENT') {
            if (req.body.payment) {
                delete req.body.payment;
            }
            job = await jobService.createJobForClient(req.body, req.user.client_id, req.user.id);
        } else {
            if (req.body.payment && !['ADMIN', 'GM'].includes(req.user.role)) {
                delete req.body.payment;
            }
            const skipMandatoryDocumentCheck = req.body.skip_mandatory_check === true && ['ADMIN', 'GM'].includes(req.user.role);
            job = await jobService.createJob(req.body, req.user.id, { skipMandatoryDocumentCheck });
        }
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const getJobs = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const result = await jobService.getJobs(req.query, scopeFilters, req.user.role, req.user);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

export const getJobById = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const job = await jobService.getJobById(req.params.id, scopeFilters, req.user);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const getEligibleSurveyors = async (req, res, next) => {
    try {
        const surveyors = await jobService.getEligibleSurveyors(req.params.id, req.query);
        res.json({ success: true, data: surveyors });
    } catch (error) { next(error); }
};

// ─────────────────────────────────────────────
// Workflow Transitions (each maps to exactly one transition)
// ─────────────────────────────────────────────

/** CREATED → DOCUMENT_VERIFIED  (TO) */
export const verifyJobDocuments = async (req, res, next) => {
    try {
        const result = await jobService.verifyJobCertificateDocuments(req.params.jobCertificateId, req.body, req.user);
        res.json({ success: true, message: result.message, data: result.data });
    } catch (error) { next(error); }
};

export const verifyAllJobDocuments = async (req, res, next) => {
    try {
        const result = await jobService.verifyAllJobDocuments(req.params.id, req.body, req.user);
        res.json({ success: true, message: result.message, data: result.data });
    } catch (error) { next(error); }
};

/** DOCUMENT_VERIFIED → APPROVED  (ADMIN / GM) */
export const approveRequest = async (req, res, next) => {
    try {
        const job = await jobService.approveRequest(req.params.id, req.body?.remarks, req.user);
        res.json({ success: true, message: 'Job approved.', data: job });
    } catch (error) { next(error); }
};

/** APPROVED → FINALIZED  (ADMIN / GM / TM) - only for non-survey jobs */
export const finalizeJob = async (req, res, next) => {
    try {
        const job = await jobService.finalizeJob(req.params.id, req.body?.remarks, req.user, {
            job_certificate_id: req.body?.job_certificate_id
        });
        res.json({ success: true, message: 'Job finalized.', data: job });
    } catch (error) { next(error); }
};

/** Bulk assign surveyor to all certificates under a Job Request (ADMIN / GM) */
export const assignSurveyor = async (req, res, next) => {
    try {
        const surveyorId = req.body.surveyorId || req.body.surveyor_id;
        const job = await jobService.assignSurveyor(req.params.id, surveyorId, req.user);
        res.json({ success: true, message: 'Surveyor bulk assigned to all certificates.', data: job });
    } catch (error) { next(error); }
};

/** Split assign surveyor to a specific certificate row (ADMIN / GM) */
export const assignSurveyorToCertificate = async (req, res, next) => {
    try {
        const surveyorId = req.body.surveyorId || req.body.surveyor_id;
        const jc = await jobService.assignSurveyorToCertificate(req.params.jobCertificateId, surveyorId, req.user);
        res.json({ success: true, message: 'Surveyor assigned to certificate.', data: jc });
    } catch (error) { next(error); }
};

/** Re-assign surveyor without status change  (GM / TM) */
export const reassignSurveyor = async (req, res, next) => {
    try {
        const surveyorId = req.body.surveyorId || req.body.surveyor_id;
        const job = await jobService.reassignSurveyor(req.params.id, surveyorId, req.body.reason, req.user);
        res.json({ success: true, message: 'Surveyor reassigned.', data: job });
    } catch (error) { next(error); }
};

export const reassignSurveyorToCertificate = async (req, res, next) => {
    try {
        const surveyorId = req.body.surveyorId || req.body.surveyor_id;
        const jc = await jobService.reassignSurveyorToCertificate(
            req.params.jobCertificateId,
            surveyorId,
            req.body.reason,
            req.user
        );
        res.json({ success: true, message: 'Surveyor reassigned for certificate.', data: jc });
    } catch (error) { next(error); }
};

/** ASSIGNED → SURVEY_AUTHORIZED (per JobCertificate) (ADMIN / TM) */
export const authorizeSurvey = async (req, res, next) => {
    try {
        const jc = await jobService.authorizeSurveyForCertificate(req.params.jobCertificateId, req.body?.remarks, req.user);
        res.json({ success: true, message: 'Survey authorized for certificate. Surveyor can begin field work.', data: jc });
    } catch (error) { next(error); }
};

/** Bulk authorize all surveys for a Job (ADMIN / TM) */
export const authorizeAllSurveys = async (req, res, next) => {
    try {
        const result = await jobService.authorizeAllSurveysForJob(req.params.id, req.body?.remarks, req.user);
        res.json({ success: true, message: result.message, data: result.data });
    } catch (error) { next(error); }
};

/** SURVEY_DONE → REVIEWED (per JobCertificate) (TO) */
export const reviewJob = async (req, res, next) => {
    try {
        const jc = await jobService.reviewJobCertificate(req.params.jobCertificateId, req.body?.remarks, req.user);
        res.json({ success: true, message: 'Certificate survey marked as reviewed.', data: jc });
    } catch (error) { next(error); }
};

/** SURVEY_DONE → REVIEWED (Bulk for all valid certificates in a Job) (TO / ADMIN) */
export const reviewAllJobCertificates = async (req, res, next) => {
    try {
        const result = await jobService.reviewAllJobCertificates(req.params.id, req.body?.remarks, req.user);
        res.json({ success: true, message: 'All completed surveys marked as reviewed.', data: result });
    } catch (error) { next(error); }
};



/** Reschedule Job (ADMIN / GM) */
export const rescheduleJob = async (req, res, next) => {
    try {
        const job = await jobService.rescheduleJob(req.params.id, req.body, req.user.id);
        res.json({ success: true, message: 'Job rescheduled successfully.', data: job });
    } catch (error) { next(error); }
};

/** → REJECTED  (terminal)  (ADMIN / GM / TM) */
export const rejectJob = async (req, res, next) => {
    try {
        const job = await jobService.rejectJob(req.params.id, req.body?.remarks, req.user);
        res.json({ success: true, message: 'Job rejected.', data: job });
    } catch (error) { next(error); }
};

/** → REJECTED  (cancel path, also CLIENT-allowed) */
export const cancelJob = async (req, res, next) => {
    try {
        let job;
        if (req.user.role === 'CLIENT') {
            job = await jobService.cancelJobForClient(req.params.id, req.body.reason, req.user.client_id, req.user.id);
        } else {
            job = await jobService.cancelJob(req.params.id, req.body.reason, req.user.id);
        }
        res.json({ success: true, message: 'Job cancelled.', data: job });
    } catch (error) { next(error); }
};

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
export const updatePriority = async (req, res, next) => {
    try {
        const job = await jobService.updatePriority(req.params.id, req.body.priority, req.body.reason, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const getHistory = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const history = await jobService.getJobHistory(req.params.id, scopeFilters, req.user);
        res.json({ success: true, data: history });
    } catch (error) { next(error); }
};

// ─────────────────────────────────────────────
// Job Documents
// ─────────────────────────────────────────────
export const getJobDocuments = async (req, res, next) => {
    try {
        const docs = await jobService.getJobDocuments(req.params.id, req.user);
        res.json({ success: true, data: docs });
    } catch (error) { next(error); }
};

export const uploadJobDocuments = async (req, res, next) => {
    try {
        const docs = await jobService.uploadJobDocuments(req.params.id, req.body.documents, req.user);
        res.status(201).json({ success: true, message: 'Documents uploaded successfully.', data: docs });
    } catch (error) { next(error); }
};

export const reuploadJobDocument = async (req, res, next) => {
    try {
        const doc = await jobService.reuploadJobDocument(req.params.id, req.params.documentId, req.body, req.user);
        res.json({ success: true, message: 'Document re-uploaded successfully.', data: doc });
    } catch (error) { next(error); }
};

export const addInternalNote = async (req, res, next) => {
    try {
        const note = await jobService.addInternalNote(req.params.id, req.body.note_text, req.user.id);
        res.status(201).json({ success: true, data: note });
    } catch (error) { next(error); }
};

// ─────────────────────────────────────────────
// Messaging (pass-through)
// ─────────────────────────────────────────────
export const getJobMessages = async (jobId, isInternal) => {
    return await jobMessagingService.getJobMessages(jobId, isInternal);
};

export const sendMessage = async (jobId, senderId, data) => {
    return await jobMessagingService.sendMessage(jobId, senderId, data);
};

export const listExternalJobMessages = async (req, res, next) => {
    try {
        const messages = await getJobMessages(req.params.id, false);
        res.json({ success: true, data: messages, message: '' });
    } catch (e) { next(e); }
};

export const listInternalJobMessages = async (req, res, next) => {
    try {
        const messages = await getJobMessages(req.params.id, true);
        res.json({ success: true, data: messages, message: '' });
    } catch (e) { next(e); }
};

const handleCreateJobMessage = async (req, res, next, isInternal) => {
    try {
        let attachmentUrl = null;
        if (req.files && req.files.length > 0) {
            const file = req.files[0];
            const s3Service = await import('../../services/s3.service.js');
            attachmentUrl = await s3Service.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                s3Service.UPLOAD_FOLDERS.JOBS_ATTACHMENTS || 'jobs/attachments'
            );
        }

        const messageText = req.body.message_text || req.body.message || '';
        const data = {
            message_text: messageText,
            is_internal: isInternal,
            attachment_url: attachmentUrl || req.body.attachment_url || req.body.attachmentKey || null
        };

        const message = await sendMessage(req.params.id, req.user.id, data);
        res.status(201).json({ success: true, data: message, message: '' });
    } catch (e) { next(e); }
};

export const createExternalJobMessage = async (req, res, next) => {
    await handleCreateJobMessage(req, res, next, false);
};

export const createInternalJobMessage = async (req, res, next) => {
    await handleCreateJobMessage(req, res, next, true);
};

// ─────────────────────────────────────────────
// Deprecated / Removed
// ─────────────────────────────────────────────
// approveJob — REMOVED. Replaced by approveRequest + authorizeSurvey + reviewJob
// updateJobStatus (generic) — REMOVED. Direct status updates blocked.
// holdJob / resumeJob — REMOVED (not part of strict workflow).
// cloneJob — REMOVED.

export const deleteJob = async (req, res, next) => {
    try {
        if (!['ADMIN', 'GM'].includes(req.user.role)) {
            throw { statusCode: 403, message: 'Only Admins and GMs can permanently delete jobs.' };
        }
        await jobService.deleteJob(req.params.id);
        res.status(200).json({ success: true, message: 'Job permanently deleted successfully.' });
    } catch (error) { next(error); }
};

export const addCertificates = async (req, res, next) => {
    try {
        const result = await jobService.addCertificatesToJob(req.params.id, req.body.certificates, req.user);
        res.status(200).json({ success: true, message: 'Certificates successfully added to job.', data: result });
    } catch (error) { next(error); }
};

export const getJobSurveyStatusReport = async (req, res, next) => {
    try {
        const reportService = await import('../reports/report.service.js');
        const { html, data } = await reportService.getSurveyStatusReportData({ job_id: req.params.id, ...req.query });
        if (req.query.format === 'json') {
            return res.json({ success: true, data });
        }
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (error) { next(error); }
};

