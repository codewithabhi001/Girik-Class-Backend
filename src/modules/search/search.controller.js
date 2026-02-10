import * as searchService from './search.service.js';

export const globalSearch = async (req, res, next) => {
    try {
        const result = await searchService.globalSearch(req.query, req.user);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
