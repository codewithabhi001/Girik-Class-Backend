import express from 'express';
import multer from 'multer';
import * as websiteController from './website.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Public GET
router.get('/videos', websiteController.getVideos);

// Admin Only Management
router.post('/videos', authenticate, authorizeRoles('ADMIN'), upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'thumbnail_url', maxCount: 1 } // Allow thumbnail_url as field name for file too to be safe with user's input
]), websiteController.uploadVideo);
router.put('/videos/:id', authenticate, authorizeRoles('ADMIN'), upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'thumbnail_url', maxCount: 1 }
]), websiteController.updateVideo);
router.delete('/videos/:id', authenticate, authorizeRoles('ADMIN'), websiteController.deleteVideo);

export default router;
