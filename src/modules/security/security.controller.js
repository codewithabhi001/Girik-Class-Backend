
import * as securityService from './security.service.js';
import db from '../../models/index.js';

const LoginAttempt = db.LoginAttempt;

export const getSessions = async (req, res, next) => {
    try {
        const userId = req.query.userId || req.user.id;
        // Only Admin can see others
        if (userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const sessions = await securityService.getActiveSessions(userId);
        res.json({ sessions });
    } catch (e) { next(e); }
};

export const revokeSession = async (req, res, next) => {
    try {
        await securityService.revokeSession(req.params.id, req.user.id);
        res.json({ message: 'Session revoked' });
    } catch (e) { next(e); }
};

export const revokeOtherSessions = async (req, res, next) => {
    try {
        // success if token middleware attaches current session ID to req.session_id or similar
        // For now assuming req.user.session_id exists or passes through
        const currentSessionId = req.user.session_id;
        if (!currentSessionId) return res.status(400).json({ message: 'Current session ID not found in context' });

        await securityService.revokeOtherSessions(currentSessionId, req.user.id);
        res.json({ message: 'All other sessions revoked' });
    } catch (e) { next(e); }
};

export const forceLogout = async (req, res, next) => {
    try {
        await securityService.forceLogoutUser(req.params.user_id, req.user.id);
        res.json({ message: 'User forcefully logged out' });
    } catch (e) { next(e); }
};

// ABAC
export const createPolicy = async (req, res, next) => {
    try {
        const policy = await securityService.createPolicy(req.body);
        res.status(201).json(policy);
    } catch (e) { next(e); }
};

export const getPolicies = async (req, res, next) => {
    try {
        const policies = await securityService.getPolicies();
        res.json({ policies });
    } catch (e) { next(e); }
};

// Old Stubs
export const getLoginAttempts = async (req, res, next) => {
    try {
        const logs = await LoginAttempt.findAll({ limit: 50, order: [['attempted_at', 'DESC']] });
        res.json(logs);
    } catch (e) { next(e); }
};
