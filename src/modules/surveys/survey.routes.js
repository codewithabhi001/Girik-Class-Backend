import express from 'express';
import multer from 'multer';
import * as surveyController from './survey.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);

// Start a new survey (check-in)
router.post('/start', authorizeRoles('SURVEYOR'), validate(schemas.startSurvey), surveyController.startSurvey);

// Submit a survey report (requires survey started + checklist submitted)
router.post('/', authorizeRoles('SURVEYOR'), validate(schemas.submitSurvey), upload.single('photo'), surveyController.submitSurveyReport);

// Finalize a survey report
router.put('/:id/finalize', authorizeRoles('SURVEYOR'), surveyController.finalizeSurvey);

// Realtime location
router.post('/:id/location', authorizeRoles('SURVEYOR'), validate(schemas.updateGps), surveyController.streamLocation);

// Evidence upload
router.post('/:id/proof', authorizeRoles('SURVEYOR'), upload.single('proof'), surveyController.uploadProof);

// List all survey reports
router.get('/', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), surveyController.getSurveyReports);

// Execution timeline
router.get('/:id/timeline', authorizeRoles('ADMIN', 'GM', 'TM'), surveyController.getTimeline);

// Violations
router.post('/:id/violation', authorizeRoles('ADMIN', 'TM'), surveyController.flagViolation);

export default router;
