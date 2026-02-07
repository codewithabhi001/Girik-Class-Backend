import * as incidentService from './incident.service.js';

export const createIncident = async (req, res, next) => {
    try {
        const incident = await incidentService.createIncident({
            ...req.body,
            reported_by: req.user.id
        });
        res.status(201).json({ message: 'Incident reported', incident });
    } catch (error) {
        next(error);
    }
};

export const getIncidents = async (req, res, next) => {
    try {
        const incidents = await incidentService.getIncidents(req.query);
        res.json({ incidents });
    } catch (error) {
        next(error);
    }
};

export const resolveIncident = async (req, res, next) => {
    try {
        const incident = await incidentService.resolveIncident(
            req.params.id,
            req.user.id,
            req.body.resolution
        );
        res.json({ message: 'Incident resolved', incident });
    } catch (error) {
        next(error);
    }
};
