import express from 'express';
import multer from 'multer';
import * as jobController from './job.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);

// ─── List & Detail ───────────────────────────────────────
router.get('/', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'TA', 'FLAG_ADMIN', 'SURVEYOR'), jobController.getJobs);
router.get('/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), jobController.getJobById);

// ─── Create ───────────────────────────────────────────────
// CREATED
router.post('/', authorizeRoles('CLIENT', 'ADMIN', 'GM'), validate(schemas.createJob), jobController.createJob);

// ─── Explicit Semantic Workflow Transitions ───────────────
// CREATED → DOCUMENT_VERIFIED  (TO)
router.put('/:id/verify-documents', authorizeRoles('TO'), jobController.verifyJobDocuments);

// DOCUMENT_VERIFIED → APPROVED   (GM / ADMIN)
router.put('/:id/approve-request', authorizeRoles('ADMIN', 'GM'), jobController.approveRequest);

// APPROVED → FINALIZED (for non-survey jobs)
router.put('/:id/finalize', authorizeRoles('ADMIN', 'GM', 'TM'), jobController.finalizeJob);

// APPROVED → ASSIGNED  (ADMIN / GM — requires surveyorId in body)
router.put('/:id/assign', authorizeRoles('ADMIN', 'GM'), jobController.assignSurveyor);
// Re-assign surveyor without status change (GM / TM)
router.put('/:id/reassign', authorizeRoles('GM', 'TM'), validate(schemas.reassignJob), jobController.reassignSurveyor);

// Reschedule
router.put('/:id/reschedule', authorizeRoles('ADMIN', 'GM'), validate(schemas.rescheduleJob), jobController.rescheduleJob);

// ASSIGNED → SURVEY_AUTHORIZED   (ADMIN / TM)
router.put('/:id/authorize-survey', authorizeRoles('ADMIN', 'TM'), jobController.authorizeSurvey);

// IN_PROGRESS / REWORK_REQUESTED → automatically handled by survey lifecycle

// SURVEY_DONE → REVIEWED   (TO — technical review)
router.put('/:id/review', authorizeRoles('TO'), jobController.reviewJob);

// REVIEWED → REWORK_REQUESTED  (ADMIN / TM / TO — requests surveyor correction)
// NOTE: preferred path is PUT /api/v1/surveys/:id/rework
router.put('/:id/send-back', authorizeRoles('ADMIN', 'TM', 'TO'), jobController.sendBackJob);

// PAYMENT_DONE → CERTIFIED  (triggered internally by certificate.service.generateCertificate)
// No direct endpoint: finalization & certification happen via survey + certificate endpoints

// ─── Rejection (terminal → REJECTED) ─────────────────────
// ADMIN: any non-terminal | GM: CREATED only | TM: ASSIGNED, SURVEY_DONE, REVIEWED
router.put('/:id/reject', authorizeRoles('ADMIN', 'GM', 'TM'), jobController.rejectJob);

// ─── Cancellation ────────────────────────────────────────
router.put('/:id/cancel', authorizeRoles('CLIENT', 'GM', 'TM', 'ADMIN'), jobController.cancelJob);

// ─── Priority ────────────────────────────────────────────
router.put('/:id/priority', authorizeRoles('ADMIN', 'GM', 'TM'), jobController.updatePriority);

// ─── History & Notes ─────────────────────────────────────
router.get('/:id/history', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), jobController.getHistory);
router.post('/:id/notes', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), jobController.addInternalNote);

// ─── Messaging ───────────────────────────────────────────
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
