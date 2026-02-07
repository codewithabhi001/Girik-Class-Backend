import express from 'express';
import * as certController from './certificate.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';


const router = express.Router();
router.use(authenticate);

// List certificate types (for Create Job dropdown) – all authenticated including CLIENT
router.get('/types', certController.getCertificateTypes);

// Generate a new certificate
// Access: ADMIN, GM, TM
router.post('/', hasRole('ADMIN', 'GM', 'TM'), certController.generateCertificate);

// List all certificates
// Access: All authenticated users
router.get('/', certController.getCertificates);

// Get certificates expiring within a range
// Access: ADMIN, GM, TM, CLIENT
router.get('/expiring', hasRole('ADMIN', 'GM', 'TM', 'CLIENT'), certController.getExpiringCertificates);

// Suspend a certificate
// Access: ADMIN, TM
router.put('/:id/suspend', hasRole('ADMIN', 'TM'), validate(schemas.certAction), certController.suspendCertificate);

// Revoke a certificate permanently
// Access: ADMIN, TM
router.put('/:id/revoke', hasRole('ADMIN', 'TM'), validate(schemas.certAction), certController.revokeCertificate);

// Restore a suspended/revoked certificate
// Access: ADMIN, TM
router.put('/:id/restore', hasRole('ADMIN', 'TM'), validate(schemas.certAction), certController.restoreCertificate);

// Renew a certificate
// Access: ADMIN, TM
router.put('/:id/renew', hasRole('ADMIN', 'TM'), validate(schemas.renewCert), certController.renewCertificate);

// Reissue a certificate (new version)
// Access: ADMIN, TM
router.post('/:id/reissue', hasRole('ADMIN', 'TM'), validate(schemas.certAction), certController.reissueCertificate);

// Preview certificate document
// Access: All authenticated users
router.get('/:id/preview', certController.previewCertificate);

// Sign a certificate
// Access: ADMIN, GM
router.post('/:id/sign', hasRole('ADMIN', 'GM'), certController.signCertificate);

// Get certificate signature
// Access: All authenticated users
router.get('/:id/signature', certController.getSignature);

// Get certificate history
// Access: All authenticated users
router.get('/:id/history', certController.getHistory);

// Advanced Management

// Transfer certificate to another vessel/owner
// Access: ADMIN, GM
router.post('/:id/transfer', hasRole('ADMIN', 'GM'), validate(schemas.certAction), certController.transferCertificate);

// Extend certificate validity
// Access: ADMIN, GM
router.post('/:id/extend', hasRole('ADMIN', 'GM'), validate(schemas.certAction), certController.extendCertificate);

// Downgrade certificate to a lower type
// Access: ADMIN, GM
router.put('/:id/downgrade', hasRole('ADMIN', 'GM'), validate(schemas.certAction), certController.downgradeCertificate);


export default router;
