import express from 'express';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import * as reportController from './report.controller.js';

const router = express.Router();

// Survey status report route (supports optional auth / direct print preview)
router.get('/survey-status', optionalAuthenticate, reportController.getSurveyStatusReport);

router.use(authenticate);
// Shared Reports accessible by TM
router.get('/certificates', authorizeRoles('ADMIN', 'GM', 'TM'), reportController.getCertificateReport);
router.get('/surveyors', authorizeRoles('ADMIN', 'GM', 'TM'), reportController.getSurveyorReport);
router.get('/non-conformities', authorizeRoles('ADMIN', 'GM', 'TM'), reportController.getNonConformityReport);

// Restricted Financial Reports
router.get('/financials', authorizeRoles('ADMIN', 'GM'), reportController.getFinancialReport);

export default router;


