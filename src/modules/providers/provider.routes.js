import express from 'express';
import * as providerController from './provider.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

// List Providers - Visible to internal ops
router.get('/', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), providerController.getProviders);

// Register Provider - Admin/GM task
router.post('/', authorizeRoles('ADMIN', 'GM'), providerController.createProvider);

// Update Status (Approve/Suspend/Blacklist) - Admin/GM only
router.put('/:id/status', authorizeRoles('ADMIN', 'GM'), providerController.updateProviderStatus);

// Evaluate Provider - Admin/GM/Technical Managers likely do this
router.post('/:id/evaluations', authorizeRoles('ADMIN', 'GM', 'TM'), providerController.evaluateProvider);
router.get('/:id/evaluations', authorizeRoles('ADMIN', 'GM', 'TM'), providerController.getEvaluations);

export default router;
