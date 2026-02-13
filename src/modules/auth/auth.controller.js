import * as authService from './auth.service.js';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password);

        res.cookie('token', token, cookieOptions);
        res.json({ user, token });
    } catch (error) {
        next(error);
    }
};

export const register = async (req, res, next) => {
    try {
        const { user, token } = await authService.register(req.body);

        res.cookie('token', token, cookieOptions);
        res.status(201).json({ user, token });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user.id);
        res.clearCookie('token', { path: cookieOptions.path, httpOnly: cookieOptions.httpOnly, secure: cookieOptions.secure, sameSite: cookieOptions.sameSite });
        res.json({ message: 'Logged out successfully', token: null });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        const result = await authService.refreshToken(token);
        res.cookie('token', result.token, cookieOptions);
        res.json({ user: result.user, token: result.token });
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
        await authService.resetPassword(req.body.token, req.body.newPassword);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
}
