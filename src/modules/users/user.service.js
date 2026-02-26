import db from '../../models/index.js';
import * as authService from '../auth/auth.service.js';

const User = db.User;

export const getUsers = async (query, excludeId) => {
    const { role } = query;
    const where = {};

    if (excludeId) {
        where.id = { [db.Sequelize.Op.ne]: excludeId };
    }

    if (role) {
        where.role = role;
    }

    return await User.findAll({
        where,
        attributes: { exclude: ['password_hash'] }
    });
};

export const getProfile = async (id, role) => {
    const include = [];
    if (role === 'CLIENT') {
        include.push({ model: db.Client });
    } else if (role === 'SURVEYOR') {
        include.push({ model: db.SurveyorProfile });
    }
    return await User.findByPk(id, {
        include,
        attributes: { exclude: ['password_hash'] }
    });
};

export const createUser = async (data) => {
    return await authService.register(data);
};

export const updateUser = async (id, data) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    if (data.email && data.email !== user.email) {
        const existing = await User.findOne({ where: { email: data.email } });
        if (existing) {
            throw { statusCode: 400, message: 'Another user with this email already exists' };
        }
    }

    await user.update(data);
    return user;
};

export const updateStatus = async (id, status) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };
    await user.update({ status });
    return user;
};

export const deleteUser = async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };
    await user.update({ status: 'DELETED' }); // Soft delete
    return { message: 'User deleted' };
};

export const updateFcmToken = async (id, fcmToken) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };
    await user.update({ fcm_token: fcmToken });
    return { success: true };
};
