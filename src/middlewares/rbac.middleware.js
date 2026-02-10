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
    }
}

export const hasRole = authorizeRoles;

// Deprecated: No more DB-driven permissions
export const checkPermission = (permissionName) => {
    return (req, res, next) => next();
};
