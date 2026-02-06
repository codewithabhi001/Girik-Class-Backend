import express from 'express';
import multer from 'multer';
import * as surveyController from './survey.controller.js';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';


const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);

// Start a new survey (check-in)
// Access: SURVEYOR
router.post('/start', hasRole('SURVEYOR'), validate(schemas.startSurvey), surveyController.startSurvey);

// Submit a survey report
// Access: SURVEYOR
router.post('/', hasRole('SURVEYOR'), upload.single('photo'), surveyController.submitSurveyReport);

// Finalize a survey report (lock for review)
// Access: SURVEYOR
router.put('/:id/finalize', hasRole('SURVEYOR'), surveyController.finalizeSurvey);

// Stream realtime location during survey
// Access: SURVEYOR
router.post('/:id/location', hasRole('SURVEYOR'), validate(schemas.updateGps), surveyController.streamLocation);

// Upload proof/evidence for visual survey
// Access: SURVEYOR
router.post('/:id/proof', hasRole('SURVEYOR'), upload.single('proof'), surveyController.uploadProof);

// Get survey execution timeline
// Access: ADMIN, GM, TM
router.get('/:id/timeline', hasRole('ADMIN', 'GM', 'TM'), surveyController.getTimeline);

// Flag a violation observed during survey
// Access: ADMIN, TM
router.post('/:id/violation', hasRole('ADMIN', 'TM'), surveyController.flagViolation);

// List all survey reports
// Access: ADMIN, GM, TM, TO
router.get('/', hasRole('ADMIN', 'GM', 'TM', 'TO'), surveyController.getSurveyReports);

export default router;
