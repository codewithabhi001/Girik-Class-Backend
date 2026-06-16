import express from 'express';
import * as systemIssuesController from './system_issues.controller.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// Public endpoint to report system issues. Optional auth captures logged in user.
router.post(
    '/',
    optionalAuthenticate,
    validate(schemas.reportSystemIssue),
    systemIssuesController.createReport
);

// Admin-only: list reports and update report status
router.get(
    '/',
    authenticate,
    authorizeRoles('ADMIN'),
    systemIssuesController.getReports
);

router.put(
    '/:id/status',
    authenticate,
    authorizeRoles('ADMIN'),
    validate(schemas.updateSystemIssueStatus),
    systemIssuesController.updateReportStatus
);

export default router;
