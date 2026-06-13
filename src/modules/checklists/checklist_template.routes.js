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
 * @route   GET /api/v1/checklist-templates/get-upload-url
 * @desc    Get a pre-signed URL for uploading a checklist template PDF
 * @access  ADMIN only
 */
router.get(
    '/get-upload-url',
    authorizeRoles('ADMIN'),
    checklistTemplateController.getUploadUrl
);

/**
 * @route   GET /api/v1/checklist-templates
 * @desc    Get all checklist templates (with optional filters)
 * @access  ADMIN, GM, TM
 * @query   ?status=ACTIVE&certificate_type_id=xxx
 */
router.get(
    '/',
    authorizeRoles('ADMIN', 'GM', 'TM'),
    checklistTemplateController.getChecklistTemplates
);

/**
 * @route   GET /api/v1/checklist-templates/job/:jobId/download
 * @desc    Download a job-specific, auto-filled checklist DOCX (generated + cached)
 * @access  SURVEYOR, ADMIN, GM, TM, TO
 * @query   ?force=true to regenerate
 */
router.get(
    '/job/:jobId/download',
    authorizeRoles('SURVEYOR', 'ADMIN', 'GM', 'TM', 'TO'),
    checklistTemplateController.downloadChecklistTemplateForJob
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
 * @access  ADMIN, GM, TM
 */
router.get(
    '/:id',
    authorizeRoles('ADMIN', 'GM', 'TM'),
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

// Clone and Delete endpoints have been removed per user requirements.

export default router;
