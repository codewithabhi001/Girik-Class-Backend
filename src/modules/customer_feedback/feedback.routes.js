
import express from 'express';
import * as feedbackController from './feedback.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

// Submit Feedback - Client Only
router.post('/', hasRole('CLIENT'), feedbackController.submitFeedback);

// View Feedback - Admin/GM (and arguably Client for their own? but prompt implies Admin/GM view list)
router.get('/', hasRole('ADMIN', 'GM'), feedbackController.getAllFeedback);
router.get('/job/:jobId', hasRole('ADMIN', 'GM', 'CLIENT'), feedbackController.getFeedbackForJob);

export default router;
