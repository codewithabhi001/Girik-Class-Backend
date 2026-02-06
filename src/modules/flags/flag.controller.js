import * as flagService from './flag.service.js';

export const createFlag = async (req, res, next) => {
    try {
        const flag = await flagService.createFlag(req.body);
        res.status(201).json(flag);
    } catch (error) {
        next(error);
    }
};

export const getFlags = async (req, res, next) => {
    try {
        const list = await flagService.getFlags();
        res.json(list);
    } catch (error) {
        next(error);
    }
};

export const updateFlag = async (req, res, next) => {
    try {
        const flag = await flagService.updateFlag(req.params.id, req.body);
        res.json(flag);
    } catch (error) {
        next(error);
    }
};
