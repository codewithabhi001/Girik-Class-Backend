import * as incidentService from './incident.service.js';

const getScopeFilters = (user) => {
    const scopeFilters = {};
    if (user.role === 'CLIENT') {
        scopeFilters.reported_by = user.id; // Or scope by vessel client_id if needed
    }
    return scopeFilters;
};

export const reportIncident = async (req, res, next) => {
    try {
        const clientId = req.user.role === 'CLIENT' ? req.user.client_id : null;
        const result = await incidentService.reportIncident(req.body, req.user.id, clientId);
        res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getIncidents = async (req, res, next) => {
    try {
        const scopeFilters = getScopeFilters(req.user);
        const result = await incidentService.getIncidents(req.query, scopeFilters);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getIncidentById = async (req, res, next) => {
    try {
        const scopeFilters = getScopeFilters(req.user);
        const result = await incidentService.getIncidentById(req.params.id, scopeFilters);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const updateStatus = async (req, res, next) => {
    try {
        const result = await incidentService.updateIncidentStatus(req.params.id, req.body.status, req.body.remarks);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
