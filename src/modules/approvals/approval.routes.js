import express from 'express';
import * as approvalController from './approval.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', authorizeRoles('ADMIN', 'GM', 'TM'), approvalController.createApproval);
router.put('/:id/step', authorizeRoles('ADMIN', 'GM', 'TM'), approvalController.updateStep);

export default router;
