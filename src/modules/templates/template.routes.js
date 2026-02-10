import express from 'express';
import * as templateController from './template.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

// Create a new checklist template
router.post('/', authorizeRoles('ADMIN'), validate(schemas.createTemplate), templateController.createTemplate);

// List templates
router.get('/', authorizeRoles('ADMIN', 'GM', 'TM'), templateController.getTemplates);

// Get a specific template
router.get('/:id', authorizeRoles('ADMIN', 'GM', 'TM'), templateController.getTemplateById);

// Update a template
router.put('/:id', authorizeRoles('ADMIN'), validate(schemas.updateTemplate), templateController.updateTemplate);

// Delete a template
router.delete('/:id', authorizeRoles('ADMIN'), templateController.deleteTemplate);

export default router;
