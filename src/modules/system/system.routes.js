import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);


// Access Policies

// Get all defined ABAC policies
// Access: ADMIN
router.get('/access-policies', hasRole('ADMIN'), systemController.getAccessPolicies);

// Create a new ABAC policy
// Access: ADMIN
router.post('/access-policies', hasRole('ADMIN'), systemController.createAccessPolicy);

// Versioning

// Get system version/build info
// Access: All authenticated users
router.get('/version', systemController.getVersion);

// Get database migration status
// Access: ADMIN
router.get('/migrations', hasRole('ADMIN'), systemController.getMigrations);

// Locales (Generic system level)

// Get supported locales
// Access: All authenticated users
router.get('/locales', systemController.getLocales);

// Add a new locale support
// Access: ADMIN
router.post('/locales', hasRole('ADMIN'), systemController.addLocale);

import * as systemController from './system.controller.js';

// Observability & Ops

// Get system operational metrics
// Access: ADMIN
router.get('/metrics', hasRole('ADMIN'), systemController.getMetrics);

// Get list of failed background jobs
// Access: ADMIN
router.get('/jobs/failed', hasRole('ADMIN'), systemController.getFailedJobs);

// Retry a specific failed job
// Access: ADMIN
router.post('/jobs/:id/retry', hasRole('ADMIN'), systemController.retryJob);

// Trigger a system maintenance action
// Access: ADMIN
router.post('/maintenance/:action', hasRole('ADMIN'), systemController.maintenanceAction);

// Health & Config

// Basic health check (liveness)
// Access: All authenticated users
router.get('/health', systemController.getHealth);

// Readiness probe (DB/Service checks)
// Access: All authenticated users
router.get('/readiness', systemController.getReadiness);

// Get enabled feature flags
// Access: All authenticated users
router.get('/feature-flags', systemController.getFeatureFlags);


export default router;

