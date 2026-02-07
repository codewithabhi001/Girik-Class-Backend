import express from 'express';
import multer from 'multer';
import * as docController from './document.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(authenticate);

// Upload a new document/file
router.post('/upload', upload.single('file'), validate(schemas.uploadDocument), docController.uploadDocument);

// Get list of documents for a specific entity
router.get('/:entity/:id', docController.getDocuments);

// Delete a document
router.delete('/:id', docController.deleteDocument);

export default router;
