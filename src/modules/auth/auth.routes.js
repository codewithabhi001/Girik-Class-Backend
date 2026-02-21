import express from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

import { validate, schemas } from '../../middlewares/validate.middleware.js';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many attempts, please try again later.' }
});

const router = express.Router();

// Login with credentials (email/password)
// Access: Public
router.post('/login', authLimiter, validate(schemas.login), authController.login);



// Logout current session (Invalidate token)
// Access: Authenticated users
router.post('/logout', authenticate, authController.logout);

// Refresh access token using refresh token
// Access: Public (requires valid refresh token)
router.post('/refresh-token', validate(schemas.refreshToken), authController.refreshToken);

// Request password reset (Send OTP/Link)
// Access: Public
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), authController.forgotPassword);

// Reset password using OTP/Token
// Access: Public
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), authController.resetPassword);

export default router;
