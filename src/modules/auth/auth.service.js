import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';
import env from '../../config/env.js';
import * as emailService from '../../services/email.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as tokenBlacklistService from '../../services/tokenBlacklist.service.js';
import { passwordReset as passwordResetTemplate } from '../../email-templates/index.js';
import { getContext } from '../../utils/context.util.js';

const User = db.User;

const PASSWORD_RESET_PURPOSE = 'password_reset';
const JWT_TYPE_ACCESS = 'access';
const JWT_TYPE_REFRESH = 'refresh';

/** Short-lived token for API requests (Bearer / cookie). */
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email, type: JWT_TYPE_ACCESS },
        env.jwt.accessSecret,
        { expiresIn: env.jwt.accessExpiresIn }
    );
};

/** Long-lived token used only to get new access token via POST /auth/refresh-token. */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, type: JWT_TYPE_REFRESH },
        env.jwt.refreshSecret,
        { expiresIn: env.jwt.refreshExpiresIn }
    );
};

export const login = async (email, password) => {
    const user = await User.findOne({ where: { email }, useMaster: true });

    if (!user) {
        throw { statusCode: 401, message: 'Invalid credentials' };
    }

    if (user.status !== 'ACTIVE') {
        throw { statusCode: 403, message: 'User is not active' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        const ctx = getContext();
        db.AuditLog.create({
            action: 'LOGIN_FAILED',
            entity_name: 'User',
            entity_id: user.id,
            ip_address: ctx.ip,
            user_agent: ctx.userAgent,
            new_values: { email }
        }).catch(() => { });
        throw { statusCode: 401, message: 'Invalid credentials' };
    }

    // Set context for audit logging
    const ctx = getContext();
    if (ctx) ctx.userId = user.id;

    // Explicit LOGIN audit log
    db.AuditLog.create({
        user_id: user.id,
        action: 'LOGIN',
        entity_name: 'User',
        entity_id: user.id,
        ip_address: ctx.ip,
        user_agent: ctx.userAgent
    }).catch(() => { });

    // Non-blocking — don't wait for this DB write
    user.update({ last_login_at: new Date() }, { user_id: user.id }).catch(() => { });

    // Resolve only profile_pic_url directly instead of full recursive resolveEntity
    let profilePicUrl = user.profile_pic_url || null;
    if (profilePicUrl && !profilePicUrl.startsWith('http')) {
        profilePicUrl = await fileAccessService.resolveUrl(profilePicUrl);
    }

    const userObj = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_pic_url: profilePicUrl
    };
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
        ...(transaction ? { transaction } : { useMaster: true }),
    });
    if (existingUser) {
        throw { statusCode: 400, message: 'Email already exists' };
    }

    // Role-based Client ID validation
    const internalRoles = ['ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'];
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

    // Set context for audit logging
    const ctx = getContext();
    if (ctx) ctx.userId = user.id;

    // Send Welcome Email (Background)
    emailService.sendTemplateEmail(user.email, 'WELCOME_USER', {
        name: user.name,
        email: user.email,
        password: userData.password,
        loginUrl: 'https://ops.grclass.com'
    }).catch(emailError => {
        console.error(`[AuthService] Background welcome email failed for ${user.email}:`, emailError.message);
    });

    const resolvedUser = await fileAccessService.resolveEntity(user);
    const userObj = {
        id: resolvedUser.id,
        name: resolvedUser.name,
        email: resolvedUser.email,
        role: resolvedUser.role,
        client_id: resolvedUser.client_id,
        profile_pic_url: resolvedUser.profile_pic_url
    };
    return {
        user: userObj,
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
    };
};

export const logout = async (userId, token) => {
    if (token) await tokenBlacklistService.blacklistToken(token);
    
    const ctx = getContext();
    db.AuditLog.create({
        user_id: userId,
        action: 'LOGOUT',
        entity_name: 'User',
        entity_id: userId,
        ip_address: ctx.ip,
        user_agent: ctx.userAgent
    }).catch(() => { });

    return true;
};

/** Accepts refresh token (body or cookie), returns new accessToken + refreshToken. */
export const refreshToken = async (refreshTokenPayload) => {
    if (!refreshTokenPayload) throw { statusCode: 401, message: 'Refresh token required' };
    try {
        const decoded = jwt.verify(refreshTokenPayload, env.jwt.refreshSecret);
        if (decoded.type !== JWT_TYPE_REFRESH) {
            throw { statusCode: 401, message: 'Invalid token type. Use refresh token.' };
        }
        const user = await User.findByPk(decoded.id, { useMaster: true });
        if (!user || user.status !== 'ACTIVE') throw new Error('User not found or inactive');

        const resolvedUser = await fileAccessService.resolveEntity(user);
        const userObj = {
            id: resolvedUser.id,
            name: resolvedUser.name,
            email: resolvedUser.email,
            role: resolvedUser.role,
            client_id: resolvedUser.client_id,
            profile_pic_url: resolvedUser.profile_pic_url
        };
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
        env.jwt.resetSecret,
        { expiresIn: env.passwordResetExpiresIn }
    );
};

export const forgotPassword = async (email) => {
    const user = await User.findOne({ where: { email }, useMaster: true });
    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }
    const resetToken = generatePasswordResetToken(user);
    const baseUrl = (env.frontendUrl || '').replace(/\/$/, '');
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const { subject, html } = passwordResetTemplate({ userName: user.name, resetLink });
    emailService.sendEmail(user.email, subject, html, 'security').catch((err) =>
        console.error('Background Email error:', err)
    );
};

export const resetPassword = async (token, newPassword) => {
    let decoded;
    try {
        decoded = jwt.verify(token, env.jwt.resetSecret);
    } catch (e) {
        throw { statusCode: 400, message: 'Invalid or expired reset link. Please request a new password reset.' };
    }
    if (decoded.purpose !== PASSWORD_RESET_PURPOSE || !decoded.userId) {
        throw { statusCode: 400, message: 'Invalid reset token.' };
    }
    const user = await User.findByPk(decoded.userId, { useMaster: true });
    if (!user) {
        throw { statusCode: 400, message: 'User not found. Please request a new password reset.' };
    }
    const salt = await bcrypt.genSalt(env.bcrypt.saltRounds || 10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password_hash: hashedPassword, force_password_reset: false });
};

export const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findByPk(userId, { useMaster: true });
    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
        throw { statusCode: 400, message: 'Incorrect old password' };
    }
    const salt = await bcrypt.genSalt(env.bcrypt.saltRounds || 10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password_hash: hashedPassword });
};

