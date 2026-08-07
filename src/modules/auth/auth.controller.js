import * as authService from './auth.service.js';
import * as cache from '../../services/cache.service.js';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
};

const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        const { user, accessToken, refreshToken } = await authService.login(email, password, { ipAddress, userAgent });

        res.cookie('token', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);
        await cache.invalidateUserProfile(user.id);
        // Return tokens in body; clients should store accessToken and refreshToken securely and send accessToken in Authorization header
        res.json({ user, accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
};

export const register = async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken } = await authService.register(req.body);

        res.cookie('token', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);
        // Tokens returned in body; store accessToken + refreshToken securely
        res.status(201).json({ user, accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user.id, req.token);
        await cache.invalidateUserProfile(req.user.id);
        const clearOpts = { path: cookieOptions.path, httpOnly: true, secure: cookieOptions.secure, sameSite: cookieOptions.sameSite };
        res.clearCookie('token', clearOpts);
        res.clearCookie('refreshToken', clearOpts);
        res.json({ message: 'Logged out successfully', accessToken: null, refreshToken: null });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const refresh = req.body.refreshToken ?? req.body.token ?? req.cookies?.refreshToken;
        const result = await authService.refreshToken(refresh);
        res.cookie('token', result.accessToken, cookieOptions);
        res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
        await cache.invalidateUserProfile(result.user.id);
        // Tokens returned in body – use new accessToken for API calls, store new refreshToken securely
        res.json({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body.email);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
}

export const resetPassword = async (req, res, next) => {
    try {
        const userId = await authService.resetPassword(req.body.token, req.body.newPassword);
        await cache.invalidateUserProfile(userId);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
}

export const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        await authService.changePassword(req.user.id, oldPassword, newPassword);
        await cache.invalidateUserProfile(req.user.id);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};
