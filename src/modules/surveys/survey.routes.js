import express from 'express';
import multer from 'multer';
import * as surveyController from './survey.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
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
// Uses :jobId so service knows which survey to update
router.post(
    '/jobs/:jobId/proof',
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

// Step 4: Check-out / submit final survey report (survey must be PROOF_UPLOADED)
router.post(
    '/',
    authorizeRoles('SURVEYOR'),
    validate(schemas.submitSurvey),
    upload.single('photo'),
    surveyController.submitSurveyReport
);

// ─────────────────────────────────────────────────────────────────────────────
// MANAGEMENT ACTIONS (TM / GM)
// ─────────────────────────────────────────────────────────────────────────────

// Finalize survey — TM ONLY (also finalizes job in same transaction)
router.put(
    '/jobs/:jobId/finalize',
    authorizeRoles('TM'),
    surveyController.finalizeSurvey
);

// Request rework — GM / TM (survey must be SUBMITTED)
router.put(
    '/jobs/:jobId/rework',
    authorizeRoles('GM', 'TM'),
    surveyController.requestRework
);

// Flag a violation (ADMIN / TM)
router.post(
    '/jobs/:jobId/violation',
    authorizeRoles('ADMIN', 'TM'),
    surveyController.flagViolation
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

export default router;
