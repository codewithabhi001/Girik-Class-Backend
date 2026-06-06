import express from 'express';
import { imageUpload } from '../../utils/upload.util.js';
import * as userController from './user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = imageUpload;
const router = express.Router();
router.use(authenticate);

// Get own profile
router.get('/me', userController.getProfile);
router.put('/me', userController.updateSelfProfile);

// Update profile picture
router.put('/profile-pic', upload.single('profile_pic'), userController.updateProfilePic);

// Update FCM token
router.put('/fcm-token', validate(schemas.updateFcmToken), userController.updateFcmToken);

// List all users
router.get('/', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), userController.getUsers);

// Create a new user
router.post('/', authorizeRoles('ADMIN'), validate(schemas.createUser), userController.createUser);

// Get user details
router.get('/:id', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), userController.getUserById);

// Update user details
router.put('/:id', authorizeRoles('ADMIN'), validate(schemas.updateUser), userController.updateUser);

// Update user status
router.put('/:id/status', authorizeRoles('ADMIN'), validate(schemas.updateUserStatus), userController.updateStatus);

// Delete user
router.delete('/:id', authorizeRoles('ADMIN'), userController.deleteUser);

export default router;
