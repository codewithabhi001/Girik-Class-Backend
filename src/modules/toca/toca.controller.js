import * as tocaService from './toca.service.js';

export const createToca = async (req, res, next) => {
    try {
        const toca = await tocaService.createToca(req.body, req.user);
        res.status(201).json(toca);
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req, res, next) => {
    try {
        const toca = await tocaService.updateStatus(req.params.id, req.body.status, req.user);
        res.json(toca);
    } catch (error) {
        next(error);
    }
};

export const getTocas = async (req, res, next) => {
    try {
        const list = await tocaService.getTocas(req.query);
        res.json(list);
    } catch (error) {
        next(error);
    }
}
