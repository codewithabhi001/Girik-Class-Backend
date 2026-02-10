import express from 'express';
import * as complianceController from './compliance.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/export/:id', hasRole('ADMIN', 'CLIENT'), complianceController.exportData);
router.post('/anonymize/:id', hasRole('ADMIN'), complianceController.anonymize);

export default router;
