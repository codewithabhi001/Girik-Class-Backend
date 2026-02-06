
import express from 'express';
import * as providerController from './provider.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

// List Providers - Visible to internal ops
router.get('/', hasRole('ADMIN', 'GM', 'TM', 'TO'), providerController.getProviders);

// Register Provider - Admin/GM task
router.post('/', hasRole('ADMIN', 'GM'), providerController.createProvider);

// Update Status (Approve/Suspend/Blacklist) - Admin/GM only
router.put('/:id/status', hasRole('ADMIN', 'GM'), providerController.updateProviderStatus);

// Evaluate Provider - Admin/GM/Technical Managers likely do this
router.post('/:id/evaluations', hasRole('ADMIN', 'GM', 'TM'), providerController.evaluateProvider);
router.get('/:id/evaluations', hasRole('ADMIN', 'GM', 'TM'), providerController.getEvaluations);

// Legal Hold - Admin/Compliance
router.post('/:id/legal-hold', hasRole('ADMIN', 'GM'), providerController.setLegalHold);

export default router;
