import express from 'express';
import multer from 'multer';
import * as jobController from './job.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);

// List all jobs
// CLIENT gets their own, others get filtered based on logic in service (for now)
router.get('/', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'TA', 'FLAG_ADMIN', 'SURVEYOR'), jobController.getJobs);

// Create a new job request
router.post('/', authorizeRoles('CLIENT', 'ADMIN', 'GM'), validate(schemas.createJob), jobController.createJob);

// Get specific job details
router.get('/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), jobController.getJobById);

// Update job status
router.put('/:id/status', authorizeRoles('ADMIN'), jobController.updateJobStatus);

// Workflow review gates
router.put('/:id/gm-approve', authorizeRoles('ADMIN', 'GM'), jobController.gmApproveJob);
router.put('/:id/gm-reject', authorizeRoles('ADMIN', 'GM'), jobController.gmRejectJob);
router.put('/:id/tm-pre-approve', authorizeRoles('TM'), jobController.tmPreApproveJob);
router.put('/:id/tm-pre-reject', authorizeRoles('TM'), jobController.tmPreRejectJob);
router.put('/:id/tm-send-back', authorizeRoles('ADMIN', 'GM', 'TM'), jobController.tmSendBackSurvey);
router.put('/:id/to-approve', authorizeRoles('TO'), jobController.toApproveSurvey);
router.put('/:id/to-send-back', authorizeRoles('TO'), jobController.toSendBackSurvey);

// Assign a surveyor to a job
router.put('/:id/assign', authorizeRoles('ADMIN', 'GM'), jobController.assignSurveyor);
// Reassign a surveyor (with reason)
router.put('/:id/reassign', authorizeRoles('GM', 'TM'), validate(schemas.reassignJob), jobController.reassignSurveyor);

// (escalate endpoint removed)

// Lifecycle Routes
router.put('/:id/cancel', authorizeRoles('CLIENT', 'GM', 'TM', 'ADMIN'), jobController.cancelJob);
router.put('/:id/hold', authorizeRoles('GM', 'TM', 'ADMIN'), jobController.holdJob);
router.put('/:id/resume', authorizeRoles('GM', 'TM', 'ADMIN'), jobController.resumeJob);
// (clone endpoint removed)

// Priority
router.put('/:id/priority', authorizeRoles('ADMIN', 'GM', 'TM'), jobController.updatePriority);

// History & Notes
router.get('/:id/history', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), jobController.getHistory);
router.post('/:id/notes', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), jobController.addInternalNote);

// Messaging
router.get('/:id/messages/external', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), async (req, res, next) => {
    try {
        const messages = await jobController.getJobMessages(req.params.id, false);
        res.json({ success: true, data: messages });
    } catch (e) { next(e); }
});

router.get('/:id/messages/internal', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), async (req, res, next) => {
    try {
        const messages = await jobController.getJobMessages(req.params.id, true);
        res.json({ success: true, data: messages });
    } catch (e) { next(e); }
});

router.post('/:id/messages', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), upload.single('attachment'), async (req, res, next) => {
    try {
        const message = await jobController.sendMessage(req.params.id, req.user.id, req.body, req.file);
        res.status(201).json({ success: true, data: message });
    } catch (e) { next(e); }
});

export default router;
