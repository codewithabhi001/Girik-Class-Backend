import * as authService from './auth.service.js';

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
        const { user, accessToken, refreshToken } = await authService.login(email, password);

        res.cookie('token', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);
        // Always return tokens in body for mobile (and web) – mobile stores these and sends accessToken in Authorization header
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
        // Tokens in body for mobile – store accessToken + refreshToken in secure storage
        res.status(201).json({ user, accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user.id);
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
        // Tokens in body for mobile – use new accessToken for API calls, store new refreshToken
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
        await authService.resetPassword(req.body.token, req.body.newPassword);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
}
