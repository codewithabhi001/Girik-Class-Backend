import * as authService from './auth.service.js';

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password, req.ip);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: 'strict'
        });


        const capabilities = authService.getCapabilities(user.role);
        res.json({ user: { ...user.toJSON(), capabilities }, token });

    } catch (error) {
        next(error);
    }
};

export const register = async (req, res, next) => {
    try {
        const { user, token } = await authService.register(req.body);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: 'strict'
        });

        res.status(201).json({ user, token });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user.id);
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully', token: null });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        const result = await authService.refreshToken(token);
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
