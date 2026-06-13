import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import * as changeRequestController from './change_request.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/', authorizeRoles('CLIENT', 'ADMIN', 'GM'), changeRequestController.createChangeRequest);
router.get('/', authorizeRoles('CLIENT', 'ADMIN', 'GM'), changeRequestController.getChangeRequests);
router.get('/:id', authorizeRoles('ADMIN', 'GM', 'CLIENT'), changeRequestController.getChangeRequestById);
router.put('/:id/approve', authorizeRoles('ADMIN', 'GM'), changeRequestController.approveChangeRequest);
router.put('/:id/reject', authorizeRoles('ADMIN', 'GM'), changeRequestController.rejectChangeRequest);

export default router;
