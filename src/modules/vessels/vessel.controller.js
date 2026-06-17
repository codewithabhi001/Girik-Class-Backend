import * as vesselService from './vessel.service.js';
import * as cache from '../../services/cache.service.js';

export const getVesselTypes = async (req, res, next) => {
    try {
        const { search } = req.query;
        const cacheKey = `vessel:types:${search || 'all'}`;
        const types = await cache.getOrSet(cacheKey, () => vesselService.getVesselTypes(search || null), cache.TTL.REFERENCE);
        res.json({
            success: true,
            message: 'Vessel types fetched successfully',
            data: types,
        });
    } catch (error) { next(error); }
};

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
        if (vessel && vessel.client_id) {
            await cache.del(`vessel:client:${vessel.client_id}`);
        }
        await cache.invalidatePattern('vessel:types:*');
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
        const vessel = await vesselService.getVesselById(req.params.id, scopeFilters, req.user);
        res.json({
            success: true,
            message: 'Vessel details fetched successfully',
            data: vessel
        });
    } catch (error) { next(error); }
};

export const getVesselsByClientId = async (req, res, next) => {
    try {
        const cacheKey = `vessel:client:${req.params.clientId}`;
        const result = await cache.getOrSet(cacheKey, () => vesselService.getVesselsByClientId(req.params.clientId), cache.TTL.VESSELS);
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
        const vessel = await vesselService.updateVessel(req.params.id, req.body, scopeFilters, req.user.id);
        if (vessel && vessel.client_id) {
            await cache.del(`vessel:client:${vessel.client_id}`);
        }
        await cache.invalidatePattern('vessel:types:*');
        res.json({
            success: true,
            message: 'Vessel updated successfully',
            data: vessel
        });
    } catch (error) { next(error); }
};

export const lookupVesselByImo = async (req, res, next) => {
    try {
        const { imo } = req.params;
        const vesselData = await vesselService.lookupVesselByImo(imo);
        res.json({
            success: true,
            message: 'Vessel details fetched from registry successfully',
            data: vesselData
        });
    } catch (error) {
        next(error);
    }
};
