
import * as systemService from './system.service.js';

export const getMetrics = async (req, res, next) => {
    try {
        const metrics = await systemService.getSystemMetrics();
        res.json(metrics);
    } catch (e) { next(e); }
};

export const getFailedJobs = async (req, res, next) => {
    try {
        const jobs = await systemService.getFailedJobs();
        res.json({ jobs });
    } catch (e) { next(e); }
};

export const retryJob = async (req, res, next) => {
    try {
        const result = await systemService.retryJob(req.params.id, req.user);
        res.json(result);
    } catch (e) { next(e); }
};


export const maintenanceAction = async (req, res, next) => {
    try {
        const result = await systemService.performMaintenance(req.params.action, req.user);
        res.json(result);
    } catch (e) { next(e); }
};

export const getHealth = async (req, res, next) => {
    // Basic liveness
    res.json({ status: 'UP', timestamp: new Date() });
};

export const getReadiness = async (req, res, next) => {
    // Deep check (DB, Redis, S3)
    try {
        const metrics = await systemService.getSystemMetrics();
        if (metrics.database.status !== 'CONNECTED') throw new Error('DB Down');
        res.json({ status: 'READY', components: metrics });
    } catch (e) {
        res.status(503).json({ status: 'NOT_READY', error: e.message });
    }
};


export const getFeatureFlags = async (req, res, next) => {
    res.json({ flags: { 'NEW_UI': true, 'BETA_REPORTS': false } });
};



export const getMigrations = async (req, res, next) => {
    try {
        const result = await systemService.getMigrations();
        res.json(result);
    } catch (e) { next(e); }
};

export const getLocales = async (req, res, next) => {
    try {
        const result = await systemService.getLocales();
        res.json(result);
    } catch (e) { next(e); }
};

export const addLocale = async (req, res, next) => {
    try {
        const result = await systemService.addLocale(req.body.code);
        res.json(result);
    } catch (e) { next(e); }
};

export const getVersion = async (req, res, next) => {
    res.json({ version: '1.0.0', build: 'prod-release-01' });
};


