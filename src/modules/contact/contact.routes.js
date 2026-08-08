import express from 'express';
import rateLimit from 'express-rate-limit';
import * as contactController from './contact.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

const contactRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 5, // Limit each IP to 5 requests per 10 minutes
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: {
        success: false,
        message: 'Too many contact requests from this IP. Please try again after 10 minutes.'
    }
});

// Middleware to validate Origin and Referer headers for public submission
const verifyOrigin = (req, res, next) => {
    const origin = req.headers.origin || req.headers.referer || '';
    const allowedOrigins = [
        'grclass.com',
        'www.grclass.com',
        'localhost',
        '127.0.0.1'
    ];

    if (!origin && process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Origin header required.'
        });
    }

    if (origin) {
        const isAllowed = allowedOrigins.some(domain => origin.includes(domain));
        if (!isAllowed && process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Requests from this origin are not allowed.'
            });
        }
    }

    next();
};

// ─── PUBLIC – No auth required ─────────────────────────────────────────────
// Anyone visiting the portfolio website can submit a contact message.
router.post(
    '/',
    verifyOrigin,
    contactRateLimiter,
    validate(schemas.submitContactEnquiry),
    contactController.submitEnquiry
);

// ─── ADMIN / GM – Protected routes ────────────────────────────────────────
router.get(
    '/stats',
    authenticate,
    authorizeRoles('ADMIN', 'GM'),
    contactController.getEnquiryStats
);

router.get(
    '/',
    authenticate,
    authorizeRoles('ADMIN', 'GM'),
    contactController.getAllEnquiries
);

router.get(
    '/:id',
    authenticate,
    authorizeRoles('ADMIN', 'GM'),
    contactController.getEnquiryById
);

router.patch(
    '/:id/status',
    authenticate,
    authorizeRoles('ADMIN', 'GM'),
    validate(schemas.updateContactEnquiryStatus),
    contactController.updateEnquiryStatus
);

router.delete(
    '/:id',
    authenticate,
    authorizeRoles('ADMIN'),
    contactController.deleteEnquiry
);

export default router;
