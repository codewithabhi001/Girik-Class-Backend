import express from 'express';
import { docUpload } from '../../utils/upload.util.js';
import * as surveyController from './survey.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles, preventSelfApproval } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = docUpload;
const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────────────
// SURVEYOR WORKFLOW (sequential — must go in order)
// ─────────────────────────────────────────────────────────────────────────────

// Step 1: Check-in & start survey (job must be SURVEY_AUTHORIZED)
router.post(
    '/start',
    authorizeRoles('SURVEYOR'),
    validate(schemas.startSurvey),
    surveyController.startSurvey
);

// Step 2: Submit checklist → handled in checklist.routes.js
// PUT /api/v1/checklists/jobs/:jobId/checklist

// Step 3: Upload evidence proof (survey must be CHECKLIST_SUBMITTED)
router.post(
    '/:jobCertificateId/proof',
    authorizeRoles('SURVEYOR'),
    upload.single('proof'),
    surveyController.uploadProof
);

// Step 3b: Stream GPS location during survey
router.post(
    '/jobs/:jobId/location',
    authorizeRoles('SURVEYOR'),
    validate(schemas.updateGps),
    surveyController.streamLocation
);

// Step 3c: Offline sync — replay batched checklist answers and GPS points
router.post(
    '/jobs/:jobId/sync',
    authorizeRoles('SURVEYOR'),
    surveyController.syncOfflineData
);

// Step 4: Check-out / submit final survey report (survey must be PROOF_UPLOADED)
router.post(
    '/:jobCertificateId/submit',
    authorizeRoles('SURVEYOR'),
    validate(schemas.submitSurvey),
    upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'signature', maxCount: 1 }]),
    surveyController.submitSurveyReport
);

// ─────────────────────────────────────────────────────────────────────────────
// MANAGEMENT ACTIONS (TM / GM)
// ─────────────────────────────────────────────────────────────────────────────

// Finalize survey (bulk for entire job) — TM ONLY
router.put(
    '/jobs/:jobId/finalize',
    authorizeRoles('TM', 'ADMIN'),
    validate(schemas.finalizeSurvey),
    surveyController.finalizeSurvey
);

// Request rework for job — ADMIN / GM / TM (survey must be SUBMITTED)
router.put(
    '/jobs/:jobId/rework',
    authorizeRoles('ADMIN', 'GM', 'TM'),
    surveyController.requestRework
);

// Flag a violation for job (SURVEYOR / TM / ADMIN)
router.post(
    '/jobs/:jobId/violation',
    authorizeRoles('SURVEYOR', 'TM', 'ADMIN'),
    surveyController.flagViolation
);

// Draft Survey Statement for job (Surveyor / TM)
router.post(
    '/jobs/:jobId/statement/draft',
    authorizeRoles('SURVEYOR', 'TM', 'ADMIN'),
    validate(schemas.draftSurveyStatement),
    surveyController.draftStatement
);

// Issue Survey Statement for job (TM ONLY - requires signed PDF)
router.post(
    '/jobs/:jobId/statement/issue',
    authorizeRoles('TM', 'ADMIN'),
    upload.single('statement'),
    surveyController.issueStatement
);

// ─────────────────────────────────────────────────────────────────────────────
// READ — All internal roles
// ─────────────────────────────────────────────────────────────────────────────

// List all survey reports
router.get(
    '/',
    authorizeRoles('ADMIN', 'GM', 'TM', 'TO'),
    surveyController.getSurveyReports
);

// Survey execution timeline for a job
router.get(
    '/jobs/:jobId/timeline',
    authorizeRoles('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'),
    surveyController.getTimeline
);

// Get survey details for a job
router.get(
    '/jobs/:jobId',
    authorizeRoles('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT'),
    surveyController.getSurveyDetails
);

export default router;
