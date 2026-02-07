import db from '../models/index.js';
import * as authService from './auth.service.js';

const User = db.User;

export const getUsers = async (query) => {
    return await User.findAll({ attributes: { exclude: ['password_hash'] } });
};

export const createUser = async (data) => {
    return await authService.register(data);
};

export const updateUser = async (id, data) => {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };
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
