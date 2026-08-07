import express from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

import { validate, schemas } from '../../middlewares/validate.middleware.js';
import rateLimit from 'express-rate-limit';
import { rateLimitClientKey } from '../../middlewares/rate-limit.util.js';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'development' ? 1000 : 20),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rateLimitClientKey,
    message: { success: false, message: 'Too many attempts, please try again later.' }
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.REFRESH_RATE_LIMIT_MAX) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rateLimitClientKey,
    message: { success: false, message: 'Too many refresh attempts, please try again later.' }
});

const router = express.Router();

import fs from 'fs';
import path from 'path';

// Login with credentials (email/password)
// Access: Public
router.post('/login', authLimiter, validate(schemas.login), authController.login);

router.get('/debug-logs', (req, res) => {
    try {
        const logContent = fs.readFileSync(path.resolve(process.cwd(), 'error.log'), 'utf8');
        const lines = logContent.split('\n').filter(l => l.trim()).slice(-100);
        res.send(lines.join('\n'));
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Logout current session (Invalidate token)
// Access: Authenticated users
router.post('/logout', authenticate, authController.logout);

// Refresh access token using refresh token
// Access: Public (requires valid refresh token)
router.post('/refresh-token', refreshLimiter, validate(schemas.refreshToken), authController.refreshToken);

// Request password reset (Send OTP/Link)
// Access: Public
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), authController.forgotPassword);

// Reset password using OTP/Token
// Access: Public
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), authController.resetPassword);

// Change password for logged-in users
// Access: Authenticated
router.post('/change-password', authenticate, validate(schemas.changePassword), authController.changePassword);

export default router;
