import express from 'express';
import multer from 'multer';
import * as documentController from './document.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(authenticate);

router.post('/upload', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'SURVEYOR'), upload.single('file'), documentController.uploadStandaloneFile);
router.get('/:entityType/:entityId', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), documentController.getDocuments);
router.post('/:entityType/:entityId', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'SURVEYOR'), upload.array('files'), documentController.uploadDocument);
router.delete('/:id', authorizeRoles('ADMIN', 'GM'), documentController.deleteDocument);

export default router;
