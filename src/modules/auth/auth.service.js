import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';
import env from '../../config/env.js';

const User = db.User;

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
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

    const token = generateToken(user);
    const userObj = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { user: userObj, token };
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

    const token = generateToken(user);
    const userObj = { id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id };
    return { user: userObj, token };
};

export const logout = async (userId) => {
    return true;
};

export const refreshToken = async (token) => {
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
};

export const resetPassword = async (token, newPassword) => {
    // Basic stub
};


