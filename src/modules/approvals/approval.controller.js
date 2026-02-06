import * as approvalService from './approval.service.js';

export const createApproval = async (req, res, next) => {
    try {
        const result = await approvalService.createApproval(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateStep = async (req, res, next) => {
    try {
        const result = await approvalService.updateStep(req.params.id, req.body.status, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
