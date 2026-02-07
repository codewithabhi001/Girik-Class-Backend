import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import * as reportController from './report.controller.js';

const router = express.Router();
router.use(authenticate);
router.use(hasRole('ADMIN', 'GM', 'TM'));

router.get('/certificates', reportController.getCertificateReport);
router.get('/surveyors', reportController.getSurveyorReport);
router.get('/non-conformities', reportController.getNonConformityReport);
router.get('/financials', reportController.getFinancialReport);

export default router;

