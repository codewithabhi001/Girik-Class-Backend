import * as userService from './user.service.js';

export const getProfile = async (req, res, next) => {
    try {
        const user = await userService.getProfile(req.user.id, req.user.role);
        res.json({ success: true, data: user });
    } catch (e) { next(e); }
};

export const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers(req.query, req.user.id);
        res.json({
            success: true,
            message: 'Users fetched successfully',
            data: users
        });
    } catch (error) { next(error); }
};

export const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) { next(error); }
};

export const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) { next(error); }
};

export const updateStatus = async (req, res, next) => {
    try {
        const user = await userService.updateStatus(req.params.id, req.body.status);
        res.json({
            success: true,
            message: `User status updated to ${req.body.status} successfully`,
            data: user
        });
    } catch (error) { next(error); }
};

export const deleteUser = async (req, res, next) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        res.json({
            success: true,
            message: 'User deleted successfully',
            data: result
        });
    } catch (error) { next(error); }
};
