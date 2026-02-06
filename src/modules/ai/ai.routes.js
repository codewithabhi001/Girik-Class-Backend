import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(hasRole('ADMIN'));


import * as aiController from './ai.controller.js';

// Detect anomalies in system data
// Access: ADMIN
router.get('/anomaly-detect', aiController.getAnomalies);

// Evaluate quality of survey reports
// Access: ADMIN
router.get('/survey-quality', aiController.getSurveyQuality);

// Calculate risk score for entities
// Access: ADMIN
router.get('/risk-score', aiController.getRiskScore);

export default router;

