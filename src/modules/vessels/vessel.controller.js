import * as vesselService from './vessel.service.js';

export const createVessel = async (req, res, next) => {
    try {
        const vessel = await vesselService.createVessel(req.body);
        res.status(201).json(vessel);
    } catch (error) {
        next(error);
    }
};

export const getVessels = async (req, res, next) => {
    try {
        const vessels = await vesselService.getVessels(req.query);
        res.json(vessels);
    } catch (error) {
        next(error);
    }
};

export const getVesselById = async (req, res, next) => {
    try {
        const vessel = await vesselService.getVesselById(req.params.id);
        res.json(vessel);
    } catch (error) {
        next(error);
    }
};

export const updateVessel = async (req, res, next) => {
    try {
        const vessel = await vesselService.updateVessel(req.params.id, req.body);
        res.json(vessel);
    } catch (error) {
        next(error);
    }
};
