import * as auditService from './audit.service.js';

export const getLogs = async (req, res, next) => {
    try {
        const logs = await auditService.getLogs(req.query);
        res.json(logs);
    } catch (error) {
        next(error);
    }
};
