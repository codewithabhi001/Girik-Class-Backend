import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', dashboardController.getDashboard);

export default router;
