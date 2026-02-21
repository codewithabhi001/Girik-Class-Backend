import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import db from '../models/index.js';
import { tokenBlacklist } from '../modules/auth/auth.service.js';

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

        if (tokenBlacklist.has(token)) {
            return res.status(401).json({ message: 'Token has been revoked' });
        }

        const decoded = jwt.verify(token, env.jwt.accessSecret);

        if (decoded.type === 'refresh') {
            return res.status(401).json({ message: 'Use access token for API calls. Use refresh token only at POST /auth/refresh-token.' });
        }

        const user = await db.User.findByPk(decoded.id);

        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
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
