import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(hasRole('ADMIN'));


import * as complianceController from './compliance.controller.js';

// Get global system audit logs
// Access: ADMIN
router.get('/logs', complianceController.getLogs);

// Compliance Features

// Export all data related to an entity (Data Portability)
// Access: ADMIN
router.post('/export_bundle', complianceController.exportBundle);

// Anonymize a user (GDPR Right to be Forgotten)
// Access: ADMIN
router.post('/anonymize/:userId', complianceController.anonymizeUser);

// Create a data retention rule
// Access: ADMIN
router.post('/retention-rules', complianceController.createRetentionRule);

// Manually trigger retention policy enforcement
// Access: ADMIN
router.post('/enforce-retention', complianceController.enforceRetention);

// Legacy/Already stubbed (updated handler)

// Set a Legal Hold on an entity (prevents deletion)
// Access: ADMIN
router.post('/legal-hold', complianceController.setLegalHold);

// Release a Legal Hold
// Access: ADMIN
router.delete('/legal-hold/:entity/:id', complianceController.releaseLegalHold);

// Get active retention rules
// Access: ADMIN
router.get('/retention', complianceController.getRetentionRules);


export default router;
