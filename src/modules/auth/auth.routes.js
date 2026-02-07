import express from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

// Login with credentials (email/password)
// Access: Public
router.post('/login', validate(schemas.login), authController.login);



// Logout current session (Invalidate token)
// Access: Authenticated users
router.post('/logout', authenticate, authController.logout);

// Refresh access token using refresh token
// Access: Public (requires valid refresh token)
router.post('/refresh-token', authController.refreshToken);

// Request password reset (Send OTP/Link)
// Access: Public
router.post('/forgot-password', authController.forgotPassword);

// Reset password using OTP/Token
// Access: Public
router.post('/reset-password', authController.resetPassword);

export default router;
