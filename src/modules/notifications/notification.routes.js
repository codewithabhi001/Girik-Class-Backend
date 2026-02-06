import express from 'express';
import * as notificationController from './notification.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

import prefRoutes from './preferences.routes.js';

const router = express.Router();
router.use(authenticate);

router.use('/', prefRoutes); // Mounts /preferences
router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markRead);

export default router;
