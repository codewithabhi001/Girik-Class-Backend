import * as activityService from './activity_request.service.js';

const getScopeFilters = (user) => {
    const scopeFilters = {};
    if (user.role === 'CLIENT') {
        scopeFilters.requested_by = user.id;
    }
    return scopeFilters;
};

export const createRequest = async (req, res, next) => {
    try {
        const result = await activityService.createActivityRequest(req.body, req.user.id);
        res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getRequests = async (req, res, next) => {
    try {
        const scopeFilters = getScopeFilters(req.user);
        const result = await activityService.getActivityRequests(req.query, scopeFilters);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getRequestById = async (req, res, next) => {
    try {
        const scopeFilters = getScopeFilters(req.user);
        const result = await activityService.getActivityRequestById(req.params.id, scopeFilters);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const updateStatus = async (req, res, next) => {
    try {
        const result = await activityService.updateActivityStatus(req.params.id, req.body.status, req.body.remarks);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
