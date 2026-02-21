import * as vesselService from './vessel.service.js';

const getScopeFilters = (user) => {
    const scopeFilters = {};
    if (user.role === 'CLIENT') {
        scopeFilters.client_id = user.client_id;
    }
    return scopeFilters;
};

export const createVessel = async (req, res, next) => {
    try {
        const vessel = await vesselService.createVessel(req.body, req.user.id);
        res.status(201).json({
            success: true,
            message: 'Vessel added successfully',
            data: vessel
        });
    } catch (error) { next(error); }
};

export const getVessels = async (req, res, next) => {
    try {
        const scopeFilters = getScopeFilters(req.user);
        const vessels = await vesselService.getVessels(req.query, scopeFilters, req.user.role);
        res.json({
            success: true,
            message: 'Vessels fetched successfully',
            data: vessels
        });
    } catch (error) { next(error); }
};

export const getVesselById = async (req, res, next) => {
    try {
        const scopeFilters = getScopeFilters(req.user);
        const vessel = await vesselService.getVesselById(req.params.id, scopeFilters);
        res.json({
            success: true,
            message: 'Vessel details fetched successfully',
            data: vessel
        });
    } catch (error) { next(error); }
};

export const getVesselsByClientId = async (req, res, next) => {
    try {
        const result = await vesselService.getVesselsByClientId(req.params.clientId);
        res.json({
            success: true,
            message: 'Client vessels fetched successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const updateVessel = async (req, res, next) => {
    try {
        const scopeFilters = getScopeFilters(req.user);
        const vessel = await vesselService.updateVessel(req.params.id, req.body, scopeFilters);
        res.json({
            success: true,
            message: 'Vessel updated successfully',
            data: vessel
        });
    } catch (error) { next(error); }
};
