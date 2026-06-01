import express from 'express';
import * as certController from './certificate.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// router.use('/authorities', caRoutes); // Removed per user request

// Public Verification - No Auth
router.get('/verify/:number', certController.verifyCertificate);

router.use(authenticate);

// Metadata – certificate types
router.get('/type-names', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.getCertificateTypeNames);
router.get('/types', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.getCertificateTypes);
router.post('/types', authorizeRoles('ADMIN'), validate(schemas.createCertificateType), certController.createCertificateType);
router.get('/types/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.getCertificateTypeById);
router.put('/types/:id', authorizeRoles('ADMIN', 'TM'), validate(schemas.updateCertificateType), certController.updateCertificateType);
router.delete('/types/:id', authorizeRoles('ADMIN'), certController.deactivateCertificateType);

// Required documents per certificate type (ADMIN/TM)
router.get('/types/:id/required-documents', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), certController.getCertificateTypeRequiredDocuments);
router.post('/types/:id/required-documents', authorizeRoles('ADMIN', 'TM'), validate(schemas.addCertificateTypeRequiredDocument), certController.addCertificateTypeRequiredDocument);
router.put('/types/:id/required-documents/:docId', authorizeRoles('ADMIN', 'TM'), validate(schemas.updateCertificateTypeRequiredDocument), certController.updateCertificateTypeRequiredDocument);
router.delete('/types/:id/required-documents/:docId', authorizeRoles('ADMIN', 'TM'), certController.deleteCertificateTypeRequiredDocument);

// List all certificates
router.get('/', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.getCertificates);
// Get internal/external upload signed URL
router.get('/upload-url', authorizeRoles('ADMIN', 'GM', 'TM'), certController.getCertificateUploadUrl);

// NEW: Upload external cert for vessel
router.post('/vessel/:vesselId/external', authorizeRoles('ADMIN', 'GM', 'TM'), validate(schemas.uploadExternalCertificate), certController.uploadExternalCertificate);

// Get certificates for a specific vessel
router.get('/vessel/:vesselId', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.getCertificatesByVessel);

// Get certificate for a specific job
router.get('/job/:jobId', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.getCertificateByJobId);

// Generate a new certificate (Draft)
router.post('/', authorizeRoles('ADMIN', 'TM', 'GM'), certController.generateCertificate);

// Update draft details
router.put('/:id', authorizeRoles('TM', 'GM'), validate(schemas.updateCertificateDraft), certController.updateDraft);

// Issue certificate (Status -> ISSUED, Generate PDF)
router.post('/:id/issue', authorizeRoles('ADMIN', 'TM', 'GM'), validate(schemas.updateCertificateDraft), certController.issueCertificate);

// Override certificate (Manual upload)
router.post('/:id/override', authorizeRoles('GM'), validate(schemas.overrideCertificate), certController.overrideCertificate);

// Get specific certificate details
router.get('/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.getCertificateById);

// Download certificate PDF
router.get('/:id/download', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.downloadCertificate);

// Suspend/Revoke/Restore
router.put('/:id/suspend', authorizeRoles('TM'), validate(schemas.certAction), certController.suspendCertificate);
router.put('/:id/revoke', authorizeRoles('TM'), validate(schemas.certAction), certController.revokeCertificate);
router.put('/:id/restore', authorizeRoles('TM'), validate(schemas.certAction), certController.restoreCertificate);

// Renew
router.put('/:id/renew', authorizeRoles('TM'), validate(schemas.renewCert), certController.renewCertificate);
router.post('/bulk-renew', authorizeRoles('TM'), certController.bulkRenew);

// Reissue (Version +1, Revoke Old)
router.post('/:id/reissue', authorizeRoles('TM'), certController.reissueCertificate);

// Preview
router.get('/:id/preview', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.previewCertificate);

// History
router.get('/:id/history', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), certController.getHistory);

// Advanced Management
router.post('/:id/transfer', authorizeRoles('GM'), validate(schemas.certAction), certController.transferCertificate);
router.post('/:id/extend', authorizeRoles('GM'), validate(schemas.certAction), certController.extendCertificate);
router.put('/:id/downgrade', authorizeRoles('GM'), validate(schemas.certAction), certController.downgradeCertificate);

export default router;
