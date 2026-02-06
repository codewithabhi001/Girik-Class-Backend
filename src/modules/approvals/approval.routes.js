import express from 'express';
import * as approvalController from './approval.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', approvalController.createApproval);
router.put('/:id/step', approvalController.updateStep);

export default router;
