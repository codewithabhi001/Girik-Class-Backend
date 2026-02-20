import * as jobService from './job.service.js';
import * as jobMessagingService from './job.messaging.service.js';
import db from '../../models/index.js';

// ─────────────────────────────────────────────
// Scope Helpers
// ─────────────────────────────────────────────
const getScopeFilters = async (user) => {
    const scopeFilters = {};
    if (user.role === 'CLIENT') {
        const vessels = await db.Vessel.findAll({ where: { client_id: user.client_id }, attributes: ['id'] });
        scopeFilters.vessel_id = vessels.map(v => v.id);
    } else if (user.role === 'SURVEYOR') {
        scopeFilters.assigned_surveyor_id = user.id;
    }
    return scopeFilters;
};

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────
export const createJob = async (req, res, next) => {
    try {
        let job;
        if (req.user.role === 'CLIENT') {
            job = await jobService.createJobForClient(req.body, req.user.client_id, req.user.id);
        } else {
            job = await jobService.createJob(req.body, req.user.id);
        }
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const getJobs = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const result = await jobService.getJobs(req.query, scopeFilters, req.user.role);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

export const getJobById = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const job = await jobService.getJobById(req.params.id, scopeFilters);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

// ─────────────────────────────────────────────
// Workflow Transitions (each maps to exactly one transition)
// ─────────────────────────────────────────────

/** CREATED → APPROVED  (ADMIN / GM) */
export const approveRequest = async (req, res, next) => {
    try {
        const job = await jobService.approveRequest(req.params.id, req.body?.remarks, req.user);
        res.json({ success: true, message: 'Job approved.', data: job });
    } catch (error) { next(error); }
};

/** APPROVED → ASSIGNED  (ADMIN / GM) */
export const assignSurveyor = async (req, res, next) => {
    try {
        const job = await jobService.assignSurveyor(req.params.id, req.body.surveyorId, req.user.id);
        res.json({ success: true, message: 'Surveyor assigned.', data: job });
    } catch (error) { next(error); }
};

/** Re-assign surveyor without status change  (GM / TM) */
export const reassignSurveyor = async (req, res, next) => {
    try {
        const job = await jobService.reassignSurveyor(req.params.id, req.body.surveyorId, req.body.reason, req.user.id);
        res.json({ success: true, message: 'Surveyor reassigned.', data: job });
    } catch (error) { next(error); }
};

/** ASSIGNED → SURVEY_AUTHORIZED  (ADMIN / TM) */
export const authorizeSurvey = async (req, res, next) => {
    try {
        const job = await jobService.authorizeSurvey(req.params.id, req.body?.remarks, req.user);
        res.json({ success: true, message: 'Survey authorized. Surveyor can now begin field work.', data: job });
    } catch (error) { next(error); }
};

/** SURVEY_DONE → REVIEWED  (TO) */
export const reviewJob = async (req, res, next) => {
    try {
        const job = await jobService.reviewJob(req.params.id, req.body?.remarks, req.user);
        res.json({ success: true, message: 'Job marked as reviewed.', data: job });
    } catch (error) { next(error); }
};

/** SURVEY_DONE / REVIEWED → REWORK_REQUESTED  (ADMIN / TM / TO) */
export const sendBackJob = async (req, res, next) => {
    try {
        const job = await jobService.sendBackJob(req.params.id, req.body?.remarks, req.user);
        res.json({ success: true, message: 'Rework requested. Surveyor has been notified.', data: job });
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
        const history = await jobService.getJobHistory(req.params.id);
        res.json({ success: true, data: history });
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

export const sendMessage = async (jobId, senderId, data, file) => {
    return await jobMessagingService.sendMessage(jobId, senderId, data, file);
};

// ─────────────────────────────────────────────
// Deprecated / Removed
// ─────────────────────────────────────────────
// approveJob — REMOVED. Replaced by approveRequest + authorizeSurvey + reviewJob
// updateJobStatus (generic) — REMOVED. Direct status updates blocked.
// holdJob / resumeJob — REMOVED (not part of strict workflow).
// cloneJob — REMOVED.
