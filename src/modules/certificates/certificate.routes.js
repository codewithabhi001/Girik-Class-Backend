import express from 'express';
import * as certController from './certificate.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// Public Verification - No Auth
router.get('/verify/:number', certController.verifyCertificate);

router.use(authenticate);

// Metadata – certificate types
router.get('/types', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.getCertificateTypes);
router.post('/types', authorizeRoles('ADMIN'), validate(schemas.createCertificateType), certController.createCertificateType);

// List all certificates
router.get('/', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.getCertificates);
// Get certificates expiring within a range
router.get('/expiring', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.getExpiringCertificates);

// Generate a new certificate
router.post('/', authorizeRoles('ADMIN', 'GM', 'TM'), certController.generateCertificate);

// Get specific certificate details
router.get('/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.getCertificateById);
// Download certificate PDF (redirects to pdf_file_url; CLIENT scoped to their vessels)
router.get('/:id/download', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.downloadCertificate);

// Suspend/Revoke/Restore
router.put('/:id/suspend', authorizeRoles('ADMIN', 'TM'), validate(schemas.certAction), certController.suspendCertificate);
router.put('/:id/revoke', authorizeRoles('ADMIN', 'TM'), validate(schemas.certAction), certController.revokeCertificate);
router.put('/:id/restore', authorizeRoles('ADMIN', 'TM'), validate(schemas.certAction), certController.restoreCertificate);

// Renew
router.put('/:id/renew', authorizeRoles('ADMIN', 'TM'), validate(schemas.renewCert), certController.renewCertificate);
router.post('/bulk-renew', authorizeRoles('ADMIN', 'TM'), certController.bulkRenew);

// Reissue
router.post('/:id/reissue', authorizeRoles('ADMIN', 'TM'), validate(schemas.certAction), certController.reissueCertificate);

// Preview & Signature
router.get('/:id/preview', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.previewCertificate);
router.post('/:id/sign', authorizeRoles('ADMIN', 'GM'), certController.signCertificate);
router.get('/:id/signature', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.getSignature);

// History
router.get('/:id/history', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.getHistory);

// Advanced Management
router.post('/:id/transfer', authorizeRoles('ADMIN', 'GM'), validate(schemas.certAction), certController.transferCertificate);
router.post('/:id/extend', authorizeRoles('ADMIN', 'GM'), validate(schemas.certAction), certController.extendCertificate);
router.put('/:id/downgrade', authorizeRoles('ADMIN', 'GM'), validate(schemas.certAction), certController.downgradeCertificate);

export default router;
