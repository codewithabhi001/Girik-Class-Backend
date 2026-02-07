
/**
 * Middleware to check if the user has one of the required roles.
 * hierarchy: ADMIN > GM > TM > ...
 * @param  {...string} allowedRoles 
 */
export const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // ADMIN always has access
        if (req.user.role === 'ADMIN') {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
        }
        next();
    }
}

// Deprecated: No more DB-driven permissions
export const checkPermission = (permissionName) => {
    return (req, res, next) => next();
};
