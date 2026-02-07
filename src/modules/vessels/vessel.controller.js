import * as vesselService from './vessel.service.js';

export const createVessel = async (req, res, next) => {
    try {
        const vessel = await vesselService.createVessel(req.body);
        res.status(201).json({
            success: true,
            message: 'Vessel added successfully',
            data: vessel
        });
    } catch (error) {
        next(error);
    }
};

export const getVessels = async (req, res, next) => {
    try {
        const vessels = await vesselService.getVessels(req.query, req.user);
        res.json({
            success: true,
            message: 'Vessels fetched successfully',
            data: vessels
        });
    } catch (error) {
        next(error);
    }
};

export const getVesselById = async (req, res, next) => {
    try {
        const vessel = await vesselService.getVesselById(req.params.id, req.user);
        res.json({
            success: true,
            message: 'Vessel details fetched successfully',
            data: vessel
        });
    } catch (error) {
        next(error);
    }
};

export const updateVessel = async (req, res, next) => {
    try {
        const vessel = await vesselService.updateVessel(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Vessel updated successfully',
            data: vessel
        });
    } catch (error) {
        next(error);
    }
};
