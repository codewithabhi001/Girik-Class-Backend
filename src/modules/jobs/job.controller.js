import * as jobService from './job.service.js';

export const createJob = async (req, res, next) => {
    try {
        const job = await jobService.createJob(req.body, req.user);
        res.status(201).json(job);
    } catch (error) {
        next(error);
    }
};

export const getJobs = async (req, res, next) => {
    try {
        const jobs = await jobService.getJobs(req.query, req.user);
        res.json(jobs);
    } catch (error) {
        next(error);
    }
};

export const getJobById = async (req, res, next) => {
    try {
        const job = await jobService.getJobById(req.params.id);
        res.json(job);
    } catch (error) {
        next(error);
    }
};

export const updateJobStatus = async (req, res, next) => {
    try {
        const { status, remarks } = req.body;
        const job = await jobService.updateJobStatus(req.params.id, status, remarks, req.user);
        res.json(job);
    } catch (error) {
        next(error);
    }
}

export const assignSurveyor = async (req, res, next) => {
    try {
        const { surveyorId } = req.body;
        const job = await jobService.assignSurveyor(req.params.id, surveyorId, req.user);
        res.json(job);
    } catch (error) {
        next(error);
    }
}

export const reassignSurveyor = async (req, res, next) => {
    try {
        const job = await jobService.reassignSurveyor(req.params.id, req.body.surveyorId, req.body.reason, req.user);
        res.json(job);
    } catch (error) {
        next(error);
    }
}


export const escalateJob = async (req, res, next) => {
    try {
        const job = await jobService.escalateJob(req.params.id, req.body.reason, req.body.target_role, req.user);
        res.json(job);
    } catch (error) {
        next(error);
    }
}

export const cancelJob = async (req, res, next) => {
    try {
        const job = await jobService.cancelJob(req.params.id, req.body.reason, req.user);
        res.json(job);
    } catch (error) { next(error); }
};

export const holdJob = async (req, res, next) => {
    try {
        const job = await jobService.holdJob(req.params.id, req.body.reason, req.user);
        res.json(job);
    } catch (error) { next(error); }
};

export const resumeJob = async (req, res, next) => {
    try {
        const job = await jobService.resumeJob(req.params.id, req.body.reason, req.user);
        res.json(job);
    } catch (error) { next(error); }
};

export const cloneJob = async (req, res, next) => {
    try {
        const job = await jobService.cloneJob(req.params.id, req.user);
        res.json(job);
    } catch (error) { next(error); }
};

export const getHistory = async (req, res, next) => {
    try {
        const history = await jobService.getJobHistory(req.params.id);
        res.json(history);
    } catch (error) { next(error); }
};

