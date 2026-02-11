import express from 'express';
import * as checklistTemplateController from './checklist_template.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/checklist-templates
 * @desc    Create a new checklist template
 * @access  ADMIN only
 */
router.post(
    '/',
    authorizeRoles('ADMIN'),
    validate(schemas.createChecklistTemplate),
    checklistTemplateController.createChecklistTemplate
);

/**
 * @route   GET /api/v1/checklist-templates
 * @desc    Get all checklist templates (with optional filters)
 * @access  ADMIN, GM, TM, SURVEYOR
 * @query   ?status=ACTIVE&certificate_type_id=xxx
 */
router.get(
    '/',
    authorizeRoles('ADMIN', 'GM', 'TM', 'SURVEYOR'),
    checklistTemplateController.getChecklistTemplates
);

/**
 * @route   GET /api/v1/checklist-templates/job/:jobId
 * @desc    Get checklist template for a specific job (what surveyor needs to fill)
 * @access  SURVEYOR, ADMIN, GM, TM, TO
 */
router.get(
    '/job/:jobId',
    authorizeRoles('SURVEYOR', 'ADMIN', 'GM', 'TM', 'TO'),
    checklistTemplateController.getChecklistTemplateForJob
);

/**
 * @route   GET /api/v1/checklist-templates/:id
 * @desc    Get a specific checklist template by ID
 * @access  ADMIN, GM, TM, SURVEYOR
 */
router.get(
    '/:id',
    authorizeRoles('ADMIN', 'GM', 'TM', 'SURVEYOR'),
    checklistTemplateController.getChecklistTemplateById
);

/**
 * @route   PUT /api/v1/checklist-templates/:id
 * @desc    Update a checklist template
 * @access  ADMIN only
 */
router.put(
    '/:id',
    authorizeRoles('ADMIN'),
    validate(schemas.updateChecklistTemplate),
    checklistTemplateController.updateChecklistTemplate
);

/**
 * @route   PUT /api/v1/checklist-templates/:id/activate
 * @desc    Activate a checklist template
 * @access  ADMIN only
 */
router.put(
    '/:id/activate',
    authorizeRoles('ADMIN'),
    checklistTemplateController.activateChecklistTemplate
);

/**
 * @route   POST /api/v1/checklist-templates/:id/clone
 * @desc    Clone a checklist template
 * @access  ADMIN only
 */
router.post(
    '/:id/clone',
    authorizeRoles('ADMIN'),
    checklistTemplateController.cloneChecklistTemplate
);

/**
 * @route   DELETE /api/v1/checklist-templates/:id
 * @desc    Delete a checklist template (soft delete)
 * @access  ADMIN only
 */
router.delete(
    '/:id',
    authorizeRoles('ADMIN'),
    checklistTemplateController.deleteChecklistTemplate
);

export default router;
