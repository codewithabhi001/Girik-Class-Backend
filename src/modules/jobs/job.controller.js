import * as jobService from './job.service.js';
import * as jobMessagingService from './job.messaging.service.js';
import db from '../../models/index.js';

const getScopeFilters = async (user) => {
    const scopeFilters = {};
    if (user.role === 'CLIENT') {
        const vessels = await db.Vessel.findAll({ where: { client_id: user.client_id }, attributes: ['id'] });
        const vesselIds = vessels.map(v => v.id);
        scopeFilters.vessel_id = vesselIds;
    } else if (user.role === 'SURVEYOR') {
        scopeFilters.gm_assigned_surveyor_id = user.id;
    }
    return scopeFilters;
};

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

export const updateJobStatus = async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN') {
            throw {
                statusCode: 403,
                message: 'Generic status update is restricted. Use workflow endpoints for GM/TM/TO approvals.'
            };
        }
        const { status, remarks } = req.body;
        const job = await jobService.updateJobStatus(req.params.id, status, remarks, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const assignSurveyor = async (req, res, next) => {
    try {
        const { surveyorId } = req.body;
        const job = await jobService.assignSurveyor(req.params.id, surveyorId, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const gmApproveJob = async (req, res, next) => {
    try {
        const job = await jobService.gmApproveJob(req.params.id, req.body?.remarks, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const gmRejectJob = async (req, res, next) => {
    try {
        const job = await jobService.gmRejectJob(req.params.id, req.body?.remarks, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const tmPreApproveJob = async (req, res, next) => {
    try {
        const job = await jobService.tmPreApproveJob(req.params.id, req.body?.remarks, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const tmPreRejectJob = async (req, res, next) => {
    try {
        const job = await jobService.tmPreRejectJob(req.params.id, req.body?.remarks, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const toApproveSurvey = async (req, res, next) => {
    try {
        const job = await jobService.toApproveSurvey(req.params.id, req.body?.remarks, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const toSendBackSurvey = async (req, res, next) => {
    try {
        const job = await jobService.toSendBackSurvey(req.params.id, req.body?.remarks, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const reassignSurveyor = async (req, res, next) => {
    try {
        const job = await jobService.reassignSurveyor(req.params.id, req.body.surveyorId, req.body.reason, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const cancelJob = async (req, res, next) => {
    try {
        let job;
        if (req.user.role === 'CLIENT') {
            job = await jobService.cancelJobForClient(req.params.id, req.body.reason, req.user.client_id, req.user.id);
        } else {
            job = await jobService.cancelJob(req.params.id, req.body.reason, req.user.id);
        }
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const holdJob = async (req, res, next) => {
    try {
        const job = await jobService.holdJob(req.params.id, req.body.reason, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const resumeJob = async (req, res, next) => {
    try {
        const job = await jobService.resumeJob(req.params.id, req.body.reason, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const cloneJob = async (req, res, next) => {
    try {
        const job = await jobService.cloneJob(req.params.id, req.user.id);
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

export const updatePriority = async (req, res, next) => {
    try {
        const job = await jobService.updatePriority(req.params.id, req.body.priority, req.body.reason, req.user.id);
        res.json({ success: true, data: job });
    } catch (error) { next(error); }
};

export const getJobMessages = async (jobId, isInternal) => {
    return await jobMessagingService.getJobMessages(jobId, isInternal);
};

export const sendMessage = async (jobId, senderId, data, file) => {
    return await jobMessagingService.sendMessage(jobId, senderId, data, file);
};
