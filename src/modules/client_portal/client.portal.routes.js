import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as jobService from '../jobs/job.service.js';
import * as certService from '../certificates/certificate.service.js';
import * as paymentService from '../payments/payment.service.js';

const router = express.Router();
router.use(authenticate);

// Client Dashboard
router.get('/dashboard', async (req, res, next) => {
    try {
        // Summary stats
        res.json({ message: 'Client Dashboard Stats' });
    } catch (e) { next(e); }
});

router.get('/jobs', async (req, res, next) => {
    try {
        req.query.user_id = req.user.id; // Force filter
        // Reuse job service but simplified view?
        const jobs = await jobService.getJobs(req.query, req.user);
        res.json(jobs);
    } catch (e) { next(e); }
});

router.get('/certificates', async (req, res, next) => {
    try {
        // reuse cert service with user filter
        const certs = await certService.getCertificates(req.query); // needs filter implementation
        res.json(certs);
    } catch (e) { next(e); }
});

export default router;
