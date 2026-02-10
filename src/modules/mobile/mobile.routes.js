import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as mobileController from './mobile.controller.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/sync', authorizeRoles('SURVEYOR'), mobileController.syncData);
router.get('/offline/jobs', authorizeRoles('SURVEYOR'), mobileController.getOfflineJobs);
router.post('/offline/surveys', authorizeRoles('SURVEYOR'), mobileController.submitOfflineSurveys);

export default router;
