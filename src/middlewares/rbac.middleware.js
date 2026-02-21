/**
 * Middleware to check if the user has one of the required roles.
 * @param  {...string} allowedRoles
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`
            });
        }
        next();
    };
};

/** Alias for authorizeRoles. Use with applyDataScope for role + data-scoped routes. */
export const requireRoles = authorizeRoles;

/**
 * Attach data-scope filter to req.dataScope by calling scopeFn(req.user).
 * Handlers (or services they call) can use req.dataScope, or compute scope themselves from req.user.
 * @param {(user: object) => Promise<object>} scopeFn - e.g. getCertificateScopeFilter
 */
export const applyDataScope = (scopeFn) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            req.dataScope = await scopeFn(req.user);
            next();
        } catch (err) {
            next(err);
        }
    };
};

export const hasRole = authorizeRoles;

// Deprecated: No more DB-driven permissions
export const checkPermission = (permissionName) => {
    return (req, res, next) => {
        return res.status(500).json({ success: false, message: 'Internal Server Error: checkPermission is deprecated. Use authorizeRoles.' });
    };
};
