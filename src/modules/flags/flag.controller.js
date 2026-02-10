import * as flagService from './flag.service.js';

export const createFlag = async (req, res, next) => {
    try {
        const flag = await flagService.createFlag(req.body);
        res.status(201).json({ success: true, data: flag });
    } catch (error) { next(error); }
};

export const getFlags = async (req, res, next) => {
    try {
        const list = await flagService.getFlags();
        res.json({ success: true, data: list });
    } catch (error) { next(error); }
};

export const updateFlag = async (req, res, next) => {
    try {
        const flag = await flagService.updateFlag(req.params.id, req.body);
        res.json({ success: true, data: flag });
    } catch (error) { next(error); }
};
