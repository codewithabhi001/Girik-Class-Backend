import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(hasRole('ADMIN')); // All SLA routes are strictly restricted to ADMIN

import * as slaController from './sla.controller.js';

// Create a new SLA rule
// Access: ADMIN
router.post('/rules', slaController.createRule);

// List active SLA rules
// Access: ADMIN
router.get('/rules', slaController.getRules);

// Manually override/escalate SLA for a job (Legacy alias)
// Access: ADMIN
router.post('/escalate/:id', slaController.overrideSla);

// Override SLA deadline for a job
// Access: ADMIN
router.put('/jobs/:id/override', slaController.overrideSla);

// Pause SLA timer for a job (e.g., waiting for client)
// Access: ADMIN
router.put('/jobs/:id/pause', slaController.pauseSla);

// Resume SLA timer for a job
// Access: ADMIN
router.put('/jobs/:id/resume', slaController.resumeSla);

// Monitor

// Manually trigger SLA breach evaluation across all jobs
// Access: ADMIN
router.post('/evaluate', slaController.evaluateSla);

// Get list of SLA breaches
// Access: ADMIN
router.get('/breaches', slaController.getBreaches);

export default router;
