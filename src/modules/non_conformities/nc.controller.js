import * as ncService from './nc.service.js';

export const createNC = async (req, res, next) => {
    try {
        const nc = await ncService.createNC(req.body, req.user);
        res.status(201).json(nc);
    } catch (error) {
        next(error);
    }
};

export const closeNC = async (req, res, next) => {
    try {
        const nc = await ncService.closeNC(req.params.id, req.body.closure_remarks);
        res.json(nc);
    } catch (error) {
        next(error);
    }
};

export const getByJob = async (req, res, next) => {
    try {
        const list = await ncService.getByJob(req.params.jobId);
        res.json(list);
    } catch (error) {
        next(error);
    }
};
