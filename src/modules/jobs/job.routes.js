import express from 'express';
import * as jobController from './job.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { checkAbac } from '../../middlewares/abac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticate);

// Create a new job request
// Access: CLIENT, ADMIN, GM
router.post('/', hasRole('CLIENT', 'ADMIN', 'GM'), validate(schemas.createJob), jobController.createJob);

// List all jobs (scoped by user role)
// Access: All authenticated users
router.get('/', jobController.getJobs);

// Get specific job details
// Access: READ policy (ABAC)
router.get('/:id', checkAbac('JOB', 'READ', req => req.params.id), jobController.getJobById);

// Update job status
// Access: ADMIN, GM, TM, TO + UPDATE policy (ABAC)
router.put('/:id/status', hasRole('ADMIN', 'GM', 'TM', 'TO'), checkAbac('JOB', 'UPDATE', req => req.params.id), jobController.updateJobStatus);

// Assign a surveyor to a job
// Access: ADMIN, GM
router.put('/:id/assign', hasRole('ADMIN', 'GM'), jobController.assignSurveyor);

// Reassign a surveyor (with reason)
// Access: GM, TM
router.put('/:id/reassign', hasRole('GM', 'TM'), validate(schemas.reassignJob), jobController.reassignSurveyor);

// Escalate a job to a higher role
// Access: GM, TM, TO
router.put('/:id/escalate', hasRole('GM', 'TM', 'TO'), validate(schemas.escalateJob), jobController.escalateJob);

// Lifecycle Routes

// Cancel a job
// Access: GM, TM, ADMIN + UPDATE policy (ABAC)
router.put('/:id/cancel', hasRole('GM', 'TM', 'ADMIN'), checkAbac('JOB', 'UPDATE', req => req.params.id), jobController.cancelJob);

// Put a job on hold
// Access: GM, TM, ADMIN + UPDATE policy (ABAC)
router.put('/:id/hold', hasRole('GM', 'TM', 'ADMIN'), checkAbac('JOB', 'UPDATE', req => req.params.id), jobController.holdJob);

// Resume a job from hold
// Access: GM, TM, ADMIN + UPDATE policy (ABAC)
router.put('/:id/resume', hasRole('GM', 'TM', 'ADMIN'), checkAbac('JOB', 'UPDATE', req => req.params.id), jobController.resumeJob);

// Clone an existing job
// Access: GM, TM, ADMIN + CREATE policy (ABAC)
router.post('/:id/clone', hasRole('GM', 'TM', 'ADMIN'), checkAbac('JOB', 'CREATE', req => req.params.id), jobController.cloneJob);

// Get job history and status changes
// Access: READ policy (ABAC)
router.get('/:id/history', checkAbac('JOB', 'READ', req => req.params.id), jobController.getHistory);



export default router;
