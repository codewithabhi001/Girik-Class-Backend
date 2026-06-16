import express from 'express';
import * as systemController from './system.controller.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// Publicly available (unauthenticated) health checks
router.get('/health', systemController.getHealth);
router.get('/readiness', systemController.getReadiness);
router.get('/version', systemController.getVersion);

// Public maintenance and app-status routes
router.get('/maintenance', optionalAuthenticate, systemController.getMaintenanceMode);
router.get('/app-status', systemController.getAppStatus);

router.use(authenticate);

// Admin-only maintenance and mobile app config routes
router.post('/maintenance', authorizeRoles('ADMIN'), validate(schemas.updateMaintenanceMode), systemController.updateMaintenanceMode);
router.get('/app-config', authorizeRoles('ADMIN'), systemController.getAppConfig);
router.post('/app-config', authorizeRoles('ADMIN'), validate(schemas.updateMobileAppConfig), systemController.updateAppConfig);

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
