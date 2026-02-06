import * as geofenceService from './geofence.service.js';

export const updateGps = async (req, res, next) => {
    try {
        const result = await geofenceService.updateGps(req.body, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const setGeoFence = async (req, res, next) => {
    try {
        const result = await geofenceService.setGeoFence(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getGeoFence = async (req, res, next) => {
    try {
        const result = await geofenceService.getGeoFence(req.params.vesselId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
