import express from 'express';
import * as feedbackController from './feedback.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

// Submit Feedback - Client Only
router.post('/', authorizeRoles('CLIENT'), feedbackController.submitFeedback);

// View Feedback
router.get('/', authorizeRoles('ADMIN', 'GM'), feedbackController.getAllFeedback);
router.get('/job/:jobId', authorizeRoles('ADMIN', 'GM', 'CLIENT'), feedbackController.getFeedbackForJob);

export default router;
