import express from 'express';
import * as auditController from './audit.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', hasRole('ADMIN'), auditController.getLogs);

export default router;
