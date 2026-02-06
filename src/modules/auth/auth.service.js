import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';
import env from '../../config/env.js';
import { Op } from 'sequelize';

const User = db.User;
const LoginAttempt = db.LoginAttempt;

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );
};

export const login = async (email, password, ipAddress) => {
    // Check for brute force
    // Limit: 5 failed attempts in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const failedAttempts = await LoginAttempt.count({
        where: {
            ip_address: ipAddress,
            success: false,
            attempted_at: {
                [Op.gt]: fifteenMinutesAgo
            }
        }
    });

    if (failedAttempts >= 5) {
        throw { statusCode: 429, message: 'Too many failed login attempts. Please try again later.' };
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
        // Log attempt without user_id (null)
        await LoginAttempt.create({ user_id: null, ip_address: ipAddress, success: false });
        throw { statusCode: 401, message: 'Invalid credentials' };
    }

    if (user.status !== 'ACTIVE') {
        throw { statusCode: 403, message: 'User is not active' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        await LoginAttempt.create({ user_id: user.id, ip_address: ipAddress, success: false });
        throw { statusCode: 401, message: 'Invalid credentials' };
    }

    await LoginAttempt.create({ user_id: user.id, ip_address: ipAddress, success: true });
    await user.update({ last_login_at: new Date() });

    const token = generateToken(user);
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

export const register = async (userData) => {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
        throw { statusCode: 400, message: 'Email already exists' };
    }

    const salt = await bcrypt.genSalt(env.bcrypt.saltRounds);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = await User.create({
        ...userData,
        password_hash: hashedPassword,
    });

    const token = generateToken(user);
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

export const logout = async (userId) => {
    // Client side handles token removal. Server side blacklist if needed (redis).
    // For now, logging.
    return true;
};

export const refreshToken = async (token) => {
    // Basic implementation: verify and issue new if valid. 
    // Ideally, use refresh tokens stored in DB.
    try {
        const decoded = jwt.verify(token, env.jwt.secret);
        const user = await User.findByPk(decoded.id);
        if (!user) throw new Error('User not found');
        return { token: generateToken(user) };
    } catch (e) {
        throw { statusCode: 401, message: 'Invalid token' };
    }
};

export const forgotPassword = async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw { statusCode: 404, message: 'User not found' };
    // Generate reset token and send email (Pseudo implementation)
    // const resetToken = ...
    // await sendEmail(user.email, resetToken);
}


export const resetPassword = async (token, newPassword) => {
    // Verify token and update password
    // verifyToken(token)
    // const salt = await bcrypt.genSalt(10);
    // const hash = await bcrypt.hash(newPassword, salt);
    // await user.update({ password_hash: hash });
}

export const getCapabilities = (role) => {
    const caps = {
        'ADMIN': ['ALL'],
        'GM': ['CERTIFICATE_SIGN', 'JOB_ESCALATE', 'OVERRIDE_SLA', 'VIEW_ALL_SURVEYS', 'APPROVE_PAYMENTS'],
        'TM': ['CERTIFICATE_REVOKE', 'JOB_ASSIGN', 'VIEW_ALL_SURVEYS', 'VERIFY_EVIDENCE'],
        'TO': ['JOB_CREATE', 'VIEW_ASSIGNED_SURVEYS'],
        'SURVEYOR': ['SUBMIT_SURVEY', 'UPLOAD_EVIDENCE', 'VIEW_ASSIGNED_JOBS'],
        'CLIENT': ['VIEW_OWN_CERTIFICATES', 'pay_INVOICES', 'create_JOBS']
    };
    return caps[role] || [];
};

