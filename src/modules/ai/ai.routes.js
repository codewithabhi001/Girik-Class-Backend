import express from 'express';
import * as aiController from './ai.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.use(authenticate);

// We limit this powerful feature to ADMIN role only
router.post('/chat', authorizeRoles('ADMIN'), aiController.chatWithAI);

export default router;
