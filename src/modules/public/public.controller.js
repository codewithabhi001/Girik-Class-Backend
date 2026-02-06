import * as publicService from './public.service.js';

export const verifyCertificate = async (req, res, next) => {
    try {
        const result = await publicService.verifyCertificate(req.params.number);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const verifyVessel = async (req, res, next) => {
    try {
        const result = await publicService.verifyVessel(req.params.imo);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
