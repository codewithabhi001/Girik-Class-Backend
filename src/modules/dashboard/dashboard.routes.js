import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', authorizeRoles('ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN'), dashboardController.getDashboard);

export default router;
