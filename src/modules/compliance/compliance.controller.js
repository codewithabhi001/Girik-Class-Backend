import * as complianceService from './compliance.service.js';

export const exportData = async (req, res, next) => {
    try {
        const result = await complianceService.exportUserData(req.params.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const anonymize = async (req, res, next) => {
    try {
        const result = await complianceService.anonymizeUser(req.params.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
