
import * as activityService from './activity_request.service.js';

export const createActivityRequest = async (req, res, next) => {
    try {
        const request = await activityService.createActivityRequest(req.body, req.user);
        res.status(201).json(request);
    } catch (error) {
        next(error);
    }
};

export const getActivityRequests = async (req, res, next) => {
    try {
        const result = await activityService.getActivityRequests(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const approveActivityRequest = async (req, res, next) => {
    try {
        const result = await activityService.approveActivityRequest(req.params.id, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const rejectActivityRequest = async (req, res, next) => {
    try {
        const { reason } = req.body;
        if (!reason) throw { statusCode: 400, message: 'Rejection reason is required' };

        const result = await activityService.rejectActivityRequest(req.params.id, reason, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getActivityRequestById = async (req, res, next) => {
    try {
        const request = await activityService.getActivityRequestById(req.params.id);
        res.json(request);
    } catch (error) {
        next(error);
    }
};
