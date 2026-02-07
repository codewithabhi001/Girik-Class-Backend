import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as jobService from '../jobs/job.service.js';
import * as certService from '../certificates/certificate.service.js';
import * as clientPortalService from './client.portal.service.js';

const router = express.Router();
router.use(authenticate);

// Client Dashboard
router.get('/dashboard', async (req, res, next) => {
    try {
        const dashboard = await clientPortalService.getClientDashboard(req.user.id);
        res.json({
            success: true,
            message: 'Client dashboard data fetched',
            data: dashboard
        });
    } catch (e) { next(e); }
});

router.get('/profile', async (req, res, next) => {
    try {
        const profile = await clientPortalService.getClientProfile(req.user.id);
        res.json({
            success: true,
            message: 'Client profile fetched',
            data: profile
        });
    } catch (e) { next(e); }
});

router.get('/jobs', async (req, res, next) => {
    try {
        // Reuse job service with user context for multi-tenancy
        const jobs = await jobService.getJobs(req.query, req.user);
        res.json({
            success: true,
            message: 'Client jobs fetched',
            data: jobs
        });
    } catch (e) { next(e); }
});

router.get('/certificates', async (req, res, next) => {
    try {
        // reuse cert service with user context
        const certs = await certService.getCertificates(req.query, req.user);
        res.json({
            success: true,
            message: 'Client fleet certificates fetched',
            data: certs
        });
    } catch (e) { next(e); }
});

export default router;
