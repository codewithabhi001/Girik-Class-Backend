
import express from 'express';
import * as activityController from './activity_request.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

// Client Creates Request
router.post('/', hasRole('CLIENT', 'ADMIN'), activityController.createActivityRequest);

// List Requests (Client sees own? Admin sees all. Service handles filter logic, RBAC allows access)
router.get('/', hasRole('CLIENT', 'ADMIN', 'GM', 'TM'), activityController.getActivityRequests);

router.get('/:id', hasRole('CLIENT', 'ADMIN', 'GM', 'TM'), activityController.getActivityRequestById);

// Approve (GM/ADMIN)
router.post('/:id/approve', hasRole('ADMIN', 'GM'), activityController.approveActivityRequest);

// Reject (GM/ADMIN)
router.post('/:id/reject', hasRole('ADMIN', 'GM'), activityController.rejectActivityRequest);


export default router;
