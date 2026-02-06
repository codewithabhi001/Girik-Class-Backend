
import express from 'express';
import * as templateController from './template.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(hasRole('ADMIN')); // Templates strictly admin managed

// Create a new checklist template
router.post('/', validate(schemas.createTemplate), templateController.createTemplate);

// List templates (with filtering)
router.get('/', templateController.getTemplates);

// Get a specific template
router.get('/:id', templateController.getTemplateById);

// Update a template
router.put('/:id', validate(schemas.updateTemplate), templateController.updateTemplate);

// Delete a template
router.delete('/:id', templateController.deleteTemplate);

export default router;
