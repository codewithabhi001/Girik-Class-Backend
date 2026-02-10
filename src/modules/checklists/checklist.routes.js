import express from 'express';
import * as checklistController from './checklist.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/jobs/:jobId/checklist', checklistController.getChecklist);
router.put('/jobs/:jobId/checklist', authorizeRoles('SURVEYOR'), validate(schemas.submitChecklist), checklistController.submitChecklist);

export default router;
