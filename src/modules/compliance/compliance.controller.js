
import * as complianceService from './compliance.service.js';

export const exportBundle = async (req, res, next) => {
    try {
        const result = await complianceService.exportBundle(req.body); // scope
        res.json(result);
    } catch (e) { next(e); }
};

export const anonymizeUser = async (req, res, next) => {
    try {
        const result = await complianceService.anonymizeUser(req.params.userId, req.user);
        res.json(result);
    } catch (e) { next(e); }
};

export const createRetentionRule = async (req, res, next) => {
    try {
        const result = await complianceService.createRetentionRule(req.body);
        res.status(201).json(result);
    } catch (e) { next(e); }
};

export const enforceRetention = async (req, res, next) => {
    try {
        const result = await complianceService.enforceRetention();
        res.json(result);
    } catch (e) { next(e); }
};

// Stubs for existing routes
export const getLogs = (req, res) => res.json({ logs: [] });
export const setLegalHold = (req, res) => res.json({ message: 'Legal Hold Applied' });
export const releaseLegalHold = (req, res) => res.json({ message: 'Legal Hold Released' });
export const getRetentionRules = (req, res) => res.json({ rules: [] });
