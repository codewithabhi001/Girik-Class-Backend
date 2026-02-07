import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import * as systemController from './system.controller.js';

const router = express.Router();
router.use(authenticate);

// Health & Config
router.get('/health', systemController.getHealth);
router.get('/readiness', systemController.getReadiness);
router.get('/version', systemController.getVersion);

// Features
router.get('/feature-flags', systemController.getFeatureFlags);
router.get('/locales', systemController.getLocales);

// Admin / Ops
router.get('/metrics', hasRole('ADMIN'), systemController.getMetrics);
router.get('/migrations', hasRole('ADMIN'), systemController.getMigrations);
router.get('/jobs/failed', hasRole('ADMIN'), systemController.getFailedJobs);
router.post('/jobs/:id/retry', hasRole('ADMIN'), systemController.retryJob);
router.post('/maintenance/:action', hasRole('ADMIN'), systemController.maintenanceAction);

export default router;
