import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import db from '../models/index.js';
import * as tokenBlacklistService from '../services/tokenBlacklist.service.js';
import { updateContextUser } from './context.middleware.js';

// ── In-memory user cache to avoid DB hit on every authenticated request ──
const _userCache = new Map();
const USER_CACHE_TTL = 60_000; // 60 seconds

/** Call this when a user's status/role changes to force re-fetch */
export const invalidateUserCache = (userId) => {
    _userCache.delete(userId);
};

export const authenticate = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else {
            return res.status(401).json({ message: 'Authentication token missing or invalid' });
        }

        if (await tokenBlacklistService.isTokenBlacklisted(token)) {
            return res.status(401).json({ message: 'Token has been revoked' });
        }

        const decoded = jwt.verify(token, env.jwt.accessSecret);

        if (decoded.type === 'refresh') {
            return res.status(401).json({ message: 'Use access token for API calls. Use refresh token only at POST /auth/refresh-token.' });
        }

        // ── Check cache first ──
        const cached = _userCache.get(decoded.id);
        let user;
        if (cached && (Date.now() - cached.ts < USER_CACHE_TTL)) {
            user = cached.user;
        } else {
            user = await db.User.findByPk(decoded.id);
            if (user) {
                _userCache.set(decoded.id, { user, ts: Date.now() });
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        if (user.status === 'SUSPENDED') {
            _userCache.delete(decoded.id);
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Please contact the GR-CLASS Administration for assistance.',
                error_code: 'ACCOUNT_SUSPENDED'
            });
        }

        if (user.status !== 'ACTIVE') {
            _userCache.delete(decoded.id);
            return res.status(401).json({ success: false, message: 'Your account is currently inactive.' });
        }

        req.user = user;
        req.token = token;
        updateContextUser(user);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

/**
 * Sets req.user when a valid access token is present; otherwise continues without auth.
 * Used for routes that behave differently for anonymous vs admin (e.g. preview unpublished CMS).
 */
export const optionalAuthenticate = async (req, res, next) => {
    try {
        let token;
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token || await tokenBlacklistService.isTokenBlacklisted(token)) {
            return next();
        }

        const decoded = jwt.verify(token, env.jwt.accessSecret);
        if (decoded.type === 'refresh') {
            return next();
        }

        // ── Check cache first ──
        const cached = _userCache.get(decoded.id);
        let user;
        if (cached && (Date.now() - cached.ts < USER_CACHE_TTL)) {
            user = cached.user;
        } else {
            user = await db.User.findByPk(decoded.id);
            if (user) {
                _userCache.set(decoded.id, { user, ts: Date.now() });
            }
        }

        if (user && user.status === 'ACTIVE') {
            req.user = user;
            req.token = token;
            updateContextUser(user);
        }
    } catch {
        // Invalid or expired token — treat as anonymous
    }
    next();
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to access this resource' });
        }

        next();
    };
};
