import express from 'express';
import multer from 'multer';
import * as websiteController from './website.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get('/videos', websiteController.getVideos); // Public or Authenticated? User said "seen on our website", so likely public GET, but Admin POST.
// If it needs to be public, we might need to remove authenticate middleware for GET.
// However, the user said "create a api for admin... from get api we can see all upload".
// Usually website content is public. I will make GET public if possible, but for now let's stick to the current pattern.
// "seen on our website" implies public access.
// But `src/routes.js` has `router.use('/public', publicRoutes);` maybe it should go there?
// Or I can just make a dedicated route.
// Let's assume the GET is public, but the management is Admin only.

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
