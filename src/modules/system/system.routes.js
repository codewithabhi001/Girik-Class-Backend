import express from 'express';
import * as systemController from './system.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.use(authenticate);

// Publicly available (but authenticated) health checks
router.get('/health', systemController.getHealth);
router.get('/readiness', systemController.getReadiness);
router.get('/version', systemController.getVersion);

// Admin / Ops Only
router.get('/metrics', authorizeRoles('ADMIN'), systemController.getMetrics);
router.get('/audit-logs', authorizeRoles('ADMIN'), systemController.getAuditLogs);
router.post('/users/:id/logout', authorizeRoles('ADMIN'), systemController.forceLogout);
router.get('/migrations', authorizeRoles('ADMIN'), systemController.getMigrations);
router.get('/jobs/failed', authorizeRoles('ADMIN'), systemController.getFailedJobs);
router.post('/jobs/:id/retry', authorizeRoles('ADMIN'), systemController.retryJob);
router.post('/maintenance/:action', authorizeRoles('ADMIN'), systemController.maintenanceAction);
router.get('/feature-flags', authorizeRoles('ADMIN'), systemController.getFeatureFlags);
router.get('/locales', authorizeRoles('ADMIN'), systemController.getLocales);

export default router;
