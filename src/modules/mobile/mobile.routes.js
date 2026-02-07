import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as mobileController from './mobile.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/sync', mobileController.syncData);
router.get('/offline/jobs', mobileController.getOfflineJobs);
router.post('/offline/surveys', mobileController.submitOfflineSurveys);

export default router;

