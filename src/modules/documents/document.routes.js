import express from 'express';
import multer from 'multer';
import * as docController from './document.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(authenticate);

// Upload a new document/file
// Access: All authenticated users
router.post('/upload', upload.single('file'), validate(schemas.uploadDocument), docController.uploadDocument);

// Get list of documents for a specific entity
// Access: All authenticated users
router.get('/:entity/:id', docController.getDocuments);

// Delete a document (Soft delete preferred)
// Access: Owner, ADMIN
router.delete('/:id', docController.deleteDocument);

// Evidence Integrity (Blockchain/Hashing style)

// Lock a document as evidence (makes it immutable)
// Access: ADMIN, GM, SURVEYOR
router.post('/:id/lock', hasRole('ADMIN', 'GM', 'SURVEYOR'), docController.lockEvidence);

// Verify integrity of a document against its lock hash
// Access: ADMIN, GM, SURVEYOR, CLIENT
router.get('/:id/verify', hasRole('ADMIN', 'GM', 'SURVEYOR', 'CLIENT'), docController.verifyIntegrity);


export default router;
