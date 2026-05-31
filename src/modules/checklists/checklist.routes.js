import express from 'express';
import * as checklistController from './checklist.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticate);

// View checklist + signed-checklist scan URLs for a certificate
router.get(
    '/job-certificates/:jobCertificateId',
    authorizeRoles('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'),
    checklistController.getChecklist
);

// Submit checklist answers + (optionally) attach signed-checklist scan keys
router.put(
    '/job-certificates/:jobCertificateId',
    authorizeRoles('SURVEYOR'),
    validate(schemas.submitChecklist),
    checklistController.submitChecklist
);

// Update ONLY signed-checklist scan keys (separate screen after answers)
router.put(
    '/job-certificates/:jobCertificateId/signed-checklist-files',
    authorizeRoles('SURVEYOR'),
    validate(schemas.updateSignedChecklistFiles),
    checklistController.updateSignedChecklistFiles
);

// Get pre-signed S3 URL to upload a single per-question evidence photo
router.get(
    '/job-certificates/:jobCertificateId/get-upload-url',
    authorizeRoles('SURVEYOR'),
    checklistController.getUploadUrl
);

// Get pre-signed S3 URL to upload the full signed-checklist document scan
router.get(
    '/job-certificates/:jobCertificateId/signed-checklist-upload-url',
    authorizeRoles('SURVEYOR'),
    checklistController.getSignedChecklistUploadUrl
);

// TM/TO Review: Approve/Reject a specific checklist question
router.put(
    '/jobs/:jobId/items/:itemId/review',
    authorizeRoles('TO', 'ADMIN'),
    validate(schemas.reviewItem),
    checklistController.reviewChecklistItem
);

// TM/TO Review: Approve/Reject a specific signed document scan (by index)
router.put(
    '/jobs/:jobId/signed-files/:fileIndex/review',
    authorizeRoles('TO', 'ADMIN'),
    validate(schemas.reviewItem), // Reuse reviewItem schema (status, reason)
    checklistController.reviewSignedDocument
);

export default router;
