import * as systemService from './system.service.js';

export const getMetrics = async (req, res, next) => {
    try {
        const result = await systemService.getSystemMetrics();
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getAuditLogs = async (req, res, next) => {
    try {
        const result = await systemService.getAuditLogs(req.query);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const forceLogout = async (req, res, next) => {
    try {
        const result = await systemService.forceLogout(req.params.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getFailedJobs = async (req, res, next) => {
    try {
        const result = await systemService.getFailedJobs();
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const retryJob = async (req, res, next) => {
    try {
        const result = await systemService.retryJob(req.params.id, req.user.email);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const maintenanceAction = async (req, res, next) => {
    try {
        const result = await systemService.performMaintenance(req.params.action, req.user.email);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getHealth = async (req, res, next) => {
    res.json({ success: true, data: { status: 'UP', timestamp: new Date() } });
};

export const getReadiness = async (req, res, next) => {
    try {
        const metrics = await systemService.getSystemMetrics();
        if (metrics.database.status !== 'CONNECTED') throw new Error('DB Down');
        res.json({ success: true, data: { status: 'READY', components: metrics } });
    } catch (e) {
        res.status(503).json({ success: false, message: 'NOT_READY', error: e.message });
    }
};

export const getFeatureFlags = async (req, res, next) => {
    res.json({ success: true, data: { flags: { 'NEW_UI': true, 'BETA_REPORTS': false } } });
};

export const getMigrations = async (req, res, next) => {
    try {
        const result = await systemService.getMigrations();
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getLocales = async (req, res, next) => {
    try {
        const result = await systemService.getLocales();
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getVersion = async (req, res, next) => {
    try {
        const result = await systemService.getVersion();
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
