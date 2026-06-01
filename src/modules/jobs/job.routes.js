import express from 'express';
import { docUpload } from '../../utils/upload.util.js';
import * as jobController from './job.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';
import { RBAC } from '../../config/rbac.config.js';

const upload = docUpload;
const router = express.Router();

router.use(authenticate);
// @deprecated - Use GET /api/v1/documents/get-upload-url instead
router.get('/upload-url', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'SURVEYOR'), jobController.getUploadUrl);

// ─── List & Detail ───────────────────────────────────────
router.get('/', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), jobController.getJobs);
router.get('/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), jobController.getJobById);
router.get('/:id/eligible-surveyors', authorizeRoles('ADMIN', 'GM', 'TM'), jobController.getEligibleSurveyors);

// ─── Create ───────────────────────────────────────────────
// CREATED
router.post('/', authorizeRoles('CLIENT', 'ADMIN', 'GM'), validate(schemas.createJob), jobController.createJob);

// ─── Explicit Semantic Workflow Transitions ───────────────

// CREATED → DOCUMENT_VERIFIED (TO / GM / ADMIN) (Bulk verify all certificates for a job)
router.put('/:id/verify-all-documents', authorizeRoles('TO', 'GM', 'ADMIN'), jobController.verifyAllJobDocuments);

// Verify specific certificate documents (TO / GM / ADMIN)
router.put('/certificates/:jobCertificateId/verify-documents', authorizeRoles('TO', 'GM', 'ADMIN'), jobController.verifyJobDocuments);

// DOCUMENT_VERIFIED → APPROVED   (GM / ADMIN)
router.put('/:id/approve-request', authorizeRoles('GM', 'ADMIN'), jobController.approveRequest);

// APPROVED → FINALIZED (for non-survey jobs)
router.put('/:id/finalize', authorizeRoles('TM'), validate(schemas.finalizeSurvey), jobController.finalizeJob);

// APPROVED → ASSIGNED  (ADMIN / GM — bulk assign surveyor to all certificates)
router.put('/:id/assign', authorizeRoles(...RBAC.ASSIGN_JOB), validate(schemas.assignJob), jobController.assignSurveyor);
// Re-assign surveyor without status change (GM / TM / ADMIN) — all certificates
router.put('/:id/reassign', authorizeRoles(...RBAC.REASSIGN_JOB), validate(schemas.reassignJob), jobController.reassignSurveyor);

// Reschedule
router.put('/:id/reschedule', authorizeRoles('GM', 'ADMIN'), validate(schemas.rescheduleJob), jobController.rescheduleJob);


// ASSIGNED → SURVEY_AUTHORIZED (Bulk for all valid certificates in a Job)
router.put('/:id/authorize-all-surveys', authorizeRoles(...RBAC.AUTHORIZE_SURVEY), jobController.authorizeAllSurveys);

// IN_PROGRESS / REWORK_REQUESTED → automatically handled by survey lifecycle

// SURVEY_DONE → REVIEWED (Bulk for all valid certificates in a Job)
router.put('/:id/review-all', authorizeRoles('TO', 'ADMIN'), jobController.reviewAllJobCertificates);

// REVIEWED → REWORK_REQUESTED  (ADMIN / TM / TO — requests surveyor correction)
// NOTE: preferred path is PUT /api/v1/surveys/:id/rework


// PAYMENT_DONE → CERTIFIED  (triggered internally by certificate.service.generateCertificate)
// No direct endpoint: finalization & certification happen via survey + certificate endpoints

// ─── Rejection (terminal → REJECTED) ─────────────────────
// ADMIN: any non-terminal | GM: CREATED only | TM: ASSIGNED, SURVEY_DONE, REVIEWED
router.put('/:id/reject', authorizeRoles('ADMIN', 'GM', 'TM'), jobController.rejectJob);

// ─── Cancellation ────────────────────────────────────────
router.put('/:id/cancel', authorizeRoles('CLIENT', 'GM', 'TM', 'ADMIN'), jobController.cancelJob);

// ─── Priority ────────────────────────────────────────────
router.put('/:id/priority', authorizeRoles('ADMIN', 'GM', 'TM'), jobController.updatePriority);

// ─── Job Documents ───────────────────────────────────────
// List documents for a job (with verification status)
router.get('/:id/documents', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), jobController.getJobDocuments);

// Upload additional documents (Client can add more docs while job is CREATED)
router.post('/:id/documents', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), jobController.uploadJobDocuments);

// Re-upload a specific rejected document (Client replaces the rejected doc)
router.put('/:id/documents/:documentId', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), jobController.reuploadJobDocument);

// ─── History & Notes ─────────────────────────────────────
router.get('/:id/history', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), jobController.getHistory);
router.post('/:id/notes', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), jobController.addInternalNote);

// ─── Messaging ───────────────────────────────────────────
router.get('/:id/messages/external', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), jobController.listExternalJobMessages);

router.get('/:id/messages/internal', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), jobController.listInternalJobMessages);

router.post('/:id/messages/external', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), upload.any(), validate(schemas.createJobMessage), jobController.createExternalJobMessage);

router.post('/:id/messages/internal', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), upload.any(), validate(schemas.createJobMessage), jobController.createInternalJobMessage);

export default router;
