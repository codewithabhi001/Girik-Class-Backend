import * as flagService from './flag.service.js';
import * as cache from '../../services/cache.service.js';

export const createFlag = async (req, res, next) => {
    try {
        const flag = await flagService.createFlag(req.body);
        await cache.invalidatePattern('flag:list:*');
        res.status(201).json({ success: true, data: flag });
    } catch (error) { next(error); }
};

export const getFlags = async (req, res, next) => {
    try {
        const search = req.query.search;
        const cacheKey = `flag:list:${search || 'all'}`;
        const list = await cache.getOrSet(cacheKey, () => flagService.getFlags(search), cache.TTL.REFERENCE);
        res.json({ success: true, data: list });
    } catch (error) { next(error); }
};

export const getFlag = async (req, res, next) => {
    try {
        const cacheKey = `flag:detail:${req.params.id}`;
        const flag = await cache.getOrSet(cacheKey, () => flagService.getFlag(req.params.id), cache.TTL.REFERENCE);
        res.json({ success: true, data: flag });
    } catch (error) { next(error); }
};  

export const updateFlag = async (req, res, next) => {
    try {
        const flag = await flagService.updateFlag(req.params.id, req.body);
        await cache.invalidatePattern('flag:list:*');
        await cache.del(`flag:detail:${req.params.id}`);
        res.json({ success: true, data: flag });
    } catch (error) { next(error); }
};

export const deleteFlag = async (req, res, next) => {
    try {
        const result = await flagService.deleteFlag(req.params.id);
        await cache.invalidatePattern('flag:list:*');
        await cache.del(`flag:detail:${req.params.id}`);
        res.json({ success: true, ...result });
    } catch (error) { next(error); }
};
