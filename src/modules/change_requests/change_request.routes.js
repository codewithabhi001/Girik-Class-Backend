import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import * as changeRequestController from './change_request.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/', changeRequestController.createChangeRequest);
router.get('/', changeRequestController.getChangeRequests);
router.put('/:id/approve', hasRole('ADMIN', 'GM'), changeRequestController.approveChangeRequest);
router.put('/:id/reject', hasRole('ADMIN', 'GM'), changeRequestController.rejectChangeRequest);

export default router;

