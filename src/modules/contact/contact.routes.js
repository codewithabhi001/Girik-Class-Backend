import express from 'express';
import * as contactController from './contact.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// ─── PUBLIC – No auth required ─────────────────────────────────────────────
// Anyone visiting the portfolio website can submit a contact message.
router.post(
    '/',
    validate(schemas.submitContactEnquiry),
    contactController.submitEnquiry
);

// ─── ADMIN / GM – Protected routes ────────────────────────────────────────
router.get(
    '/stats',
    authenticate,
    authorizeRoles('ADMIN', 'GM'),
    contactController.getEnquiryStats
);

router.get(
    '/',
    authenticate,
    authorizeRoles('ADMIN', 'GM'),
    contactController.getAllEnquiries
);

router.get(
    '/:id',
    authenticate,
    authorizeRoles('ADMIN', 'GM'),
    contactController.getEnquiryById
);

router.patch(
    '/:id/status',
    authenticate,
    authorizeRoles('ADMIN', 'GM'),
    validate(schemas.updateContactEnquiryStatus),
    contactController.updateEnquiryStatus
);

router.delete(
    '/:id',
    authenticate,
    authorizeRoles('ADMIN'),
    contactController.deleteEnquiry
);

export default router;
