import express from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

// Export single user data
// Access: ADMIN
router.post('/:id/export', hasRole('ADMIN'), (req, res) => res.json({ message: 'Export initiated', url: '...' }));

// Anonymize user data (Right to be forgotten)
// Access: ADMIN
router.post('/:id/anonymize', hasRole('ADMIN'), (req, res) => res.json({ message: 'User anonymized' }));

// List all users
// Access: ADMIN
router.get('/', hasRole('ADMIN'), userController.getUsers);

// Create a new user (Admin created)
// Access: ADMIN
router.post('/', hasRole('ADMIN'), validate(schemas.createUser), userController.createUser);

// Update user details
// Access: ADMIN
router.put('/:id', hasRole('ADMIN'), userController.updateUser);

// Update user status (Active/Inactive/Suspended)
// Access: ADMIN
router.put('/:id/status', hasRole('ADMIN'), validate(schemas.updateUserStatus), userController.updateStatus);

// Delete user (Soft delete)
// Access: ADMIN
router.delete('/:id', hasRole('ADMIN'), userController.deleteUser);

export default router;
