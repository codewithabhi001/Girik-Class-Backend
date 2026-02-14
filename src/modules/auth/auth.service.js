import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';
import env from '../../config/env.js';
import * as emailService from '../../services/email.service.js';
import { passwordReset as passwordResetTemplate } from '../../email-templates/index.js';

const User = db.User;

const PASSWORD_RESET_PURPOSE = 'password_reset';
const JWT_TYPE_ACCESS = 'access';
const JWT_TYPE_REFRESH = 'refresh';

/** Short-lived token for API requests (Bearer / cookie). */
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email, type: JWT_TYPE_ACCESS },
        env.jwt.secret,
        { expiresIn: env.jwt.accessExpiresIn }
    );
};

/** Long-lived token used only to get new access token via POST /auth/refresh-token. */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, type: JWT_TYPE_REFRESH },
        env.jwt.secret,
        { expiresIn: env.jwt.refreshExpiresIn }
    );
};

export const login = async (email, password) => {
    const user = await User.findOne({ where: { email } });

    if (!user) {
        throw { statusCode: 401, message: 'Invalid credentials' };
    }

    if (user.status !== 'ACTIVE') {
        throw { statusCode: 403, message: 'User is not active' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw { statusCode: 401, message: 'Invalid credentials' };
    }

    await user.update({ last_login_at: new Date() });

    const userObj = { id: user.id, name: user.name, email: user.email, role: user.role };
    return {
        user: userObj,
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
    };
};

export const register = async (userData, options = {}) => {
    const { transaction } = options;
    const existingUser = await User.findOne({
        where: { email: userData.email },
        ...(transaction && { transaction }),
    });
    if (existingUser) {
        throw { statusCode: 400, message: 'Email already exists' };
    }

    // Role-based Client ID validation
    const internalRoles = ['ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'FLAG_ADMIN'];
    if (internalRoles.includes(userData.role) && userData.client_id) {
        throw { statusCode: 400, message: `Role ${userData.role} cannot be associated with a Client ID.` };
    }

    if (userData.role === 'CLIENT' && !userData.client_id) {
        // exception: client creation might handle this separately, but for generic register it's needed
        // but let's keep it flexible for now or throw error
        // throw { statusCode: 400, message: 'Client ID is required for CLIENT role.' };
    }

    const salt = await bcrypt.genSalt(env.bcrypt.saltRounds || 10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const { password, ...rest } = userData;
    const user = await User.create(
        { ...rest, password_hash: hashedPassword },
        transaction ? { transaction } : undefined
    );

    const userObj = { id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id };
    return {
        user: userObj,
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
    };
};

export const logout = async (userId) => {
    return true;
};

/** Accepts refresh token (body or cookie), returns new accessToken + refreshToken. */
export const refreshToken = async (refreshTokenPayload) => {
    if (!refreshTokenPayload) throw { statusCode: 401, message: 'Refresh token required' };
    try {
        const decoded = jwt.verify(refreshTokenPayload, env.jwt.secret);
        if (decoded.type !== JWT_TYPE_REFRESH) {
            throw { statusCode: 401, message: 'Invalid token type. Use refresh token.' };
        }
        const user = await User.findByPk(decoded.id);
        if (!user || user.status !== 'ACTIVE') throw new Error('User not found or inactive');
        const userObj = { id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id };
        return {
            user: userObj,
            accessToken: generateAccessToken(user),
            refreshToken: generateRefreshToken(user),
        };
    } catch (e) {
        if (e.statusCode) throw e;
        throw { statusCode: 401, message: 'Invalid or expired refresh token' };
    }
};

const generatePasswordResetToken = (user) => {
    return jwt.sign(
        { purpose: PASSWORD_RESET_PURPOSE, userId: user.id, email: user.email },
        env.jwt.secret,
        { expiresIn: env.passwordResetExpiresIn }
    );
};

export const forgotPassword = async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        // Always return same message to avoid revealing whether email exists
        return;
    }
    const resetToken = generatePasswordResetToken(user);
    const baseUrl = (env.frontendUrl || '').replace(/\/$/, '');
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const { subject, text, html } = passwordResetTemplate({ userName: user.name, resetLink });
    await emailService.sendEmail(user.email, subject, text, html);
};

export const resetPassword = async (token, newPassword) => {
    let decoded;
    try {
        decoded = jwt.verify(token, env.jwt.secret);
    } catch (e) {
        throw { statusCode: 400, message: 'Invalid or expired reset link. Please request a new password reset.' };
    }
    if (decoded.purpose !== PASSWORD_RESET_PURPOSE || !decoded.userId) {
        throw { statusCode: 400, message: 'Invalid reset token.' };
    }
    const user = await User.findByPk(decoded.userId);
    if (!user) {
        throw { statusCode: 400, message: 'User not found. Please request a new password reset.' };
    }
    const salt = await bcrypt.genSalt(env.bcrypt.saltRounds || 10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password_hash: hashedPassword, force_password_reset: false });
};


