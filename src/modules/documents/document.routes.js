import express from 'express';
import multer from 'multer';
import * as documentController from './document.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const fileFilter = (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type ${file.mimetype} not allowed`));
};
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 }, fileFilter });
const router = express.Router();
router.use(authenticate);

router.get('/get-upload-url', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'SURVEYOR'), documentController.getUploadUrl);
router.post('/upload', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'SURVEYOR'), upload.single('file'), documentController.uploadStandaloneFile);
router.get('/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), documentController.getDocumentById);
router.get('/:entityType/:entityId', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), documentController.getDocuments);
router.post('/:entityType/:entityId', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'SURVEYOR'), upload.array('files'), documentController.uploadDocument);
router.delete('/:id', authorizeRoles('ADMIN', 'GM'), documentController.deleteDocument);

export default router;
