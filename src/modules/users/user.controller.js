import * as userService from './user.service.js';
import * as cache from '../../services/cache.service.js';

// GET /users/me — cached per user, 5 min TTL
export const getProfile = async (req, res, next) => {
    try {
        const cacheKey = `user:profile:${req.user.id}`;
        const data = await cache.getOrSet(cacheKey, () => userService.getProfile(req.user.id, req.user.role), cache.TTL.USER_PROFILE);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

// PUT /users/me — invalidate cache on update
export const updateSelfProfile = async (req, res, next) => {
    try {
        const user = await userService.updateSelfProfile(req.user.id, req.user.role, req.body);
        await cache.del(`user:profile:${req.user.id}`);
        res.json({ success: true, message: 'Profile updated successfully', data: user });
    } catch (e) { next(e); }
};

export const deleteUser = async (req, res, next) => {
    try {
        const hardDelete = req.query.hard === 'true';
        if (hardDelete && !['ADMIN', 'GM'].includes(req.user.role)) {
            throw { statusCode: 403, message: 'Only Admins and GMs can permanently delete users.' };
        }
        const result = await userService.deleteUser(req.params.id, hardDelete);
        await cache.del(`user:profile:${req.params.id}`);
        await cache.del(`user:detail:${req.params.id}`);
        res.json({ success: true, message: result.message, data: result });
    } catch (error) { next(error); }
};

export const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers(req.query, req.user.id);
        res.json({ success: true, message: 'Users fetched successfully', data: users });
    } catch (error) { next(error); }
};

export const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json({ success: true, message: 'User created successfully', data: user });
    } catch (error) { next(error); }
};

export const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        await cache.del(`user:profile:${req.params.id}`);
        await cache.del(`user:detail:${req.params.id}`);
        res.json({ success: true, message: 'User updated successfully', data: user });
    } catch (error) { next(error); }
};

export const updateStatus = async (req, res, next) => {
    try {
        const user = await userService.updateStatus(req.params.id, req.body.status);
        await cache.del(`user:profile:${req.params.id}`);
        await cache.del(`user:detail:${req.params.id}`);
        res.json({ success: true, message: `User status updated to ${req.body.status} successfully`, data: user });
    } catch (error) { next(error); }
};



export const updateFcmToken = async (req, res, next) => {
    try {
        const result = await userService.updateFcmToken(req.user.id, req.body.fcmToken);
        res.json({ success: true, message: 'FCM token updated successfully', data: result });
    } catch (error) { next(error); }
};

// PUT /users/profile-pic — invalidate so next /users/me returns fresh CDN URL
export const updateProfilePic = async (req, res, next) => {
    try {
        const result = await userService.updateProfilePic(req.user.id, req.file, req.body);
        await cache.del(`user:profile:${req.user.id}`);
        res.json({ success: true, message: 'Profile picture updated successfully', data: result });
    } catch (error) { next(error); }
};

// GET /users/:id — cached per user ID, 5 min TTL
export const getUserById = async (req, res, next) => {
    try {
        const cacheKey = `user:detail:${req.params.id}`;
        const data = await cache.getOrSet(cacheKey, () => userService.getUserById(req.params.id), cache.TTL.USER_PROFILE);
        res.json({ success: true, message: 'User details fetched successfully', data });
    } catch (error) { next(error); }
};

export const logoutAllSessions = async (req, res, next) => {
    try {
        await userService.logoutAllSessions(req.params.id);
        res.json({ success: true, message: 'All active sessions for this user have been logged out' });
    } catch (error) { next(error); }
};

export const getUserSessions = async (req, res, next) => {
    try {
        const sessions = await userService.getUserSessions(req.params.id);
        res.json({ success: true, data: sessions });
    } catch (error) { next(error); }
};


