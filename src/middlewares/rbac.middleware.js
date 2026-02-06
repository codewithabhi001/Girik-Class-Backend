import db from '../models/index.js';

/**
 * Middleware to check if the user has the required permission.
 * Assumes req.user is already populated by auth middleware.
 * @param {string} permissionName 
 */
export const checkPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            // If user is ADMIN, grant access (optional shortcut)
            if (user.role === 'ADMIN') {
                return next();
            }

            // For simple role check we can use the ENUM
            // For granular permission check, we need to query the database
            // But wait... the schema has users.role as ENUM.
            // And also a roles table and user_permissions table?
            // db.js has `role_permissions` (role_id, permission_id)
            // and keys like `role_permissions.role_id`.
            // The `users` table has `role` ENUM.
            // It implies a mapping might be needed from ENUM to the Role entity if we want to use the permission table.
            // Or maybe the `users` table should have had `role_id` instead of ENUM if it was fully normalized.
            // Given the schema, let's assume `role_name` in `roles` table matches the ENUM string.

            if (!req.userRolePermissions) {
                // Fetch permissions for the user's role if not cached/loaded
                const roleContext = await db.Role.findOne({
                    where: { role_name: user.role },
                    include: [{
                        model: db.Permission,
                        through: { attributes: [] }
                    }]
                });

                if (!roleContext) {
                    console.warn(`Role ${user.role} not found in roles table.`);
                    // Fallback: deny if strictly required, or rely on simple role checks elsewhere.
                    return res.status(403).json({ message: 'Role configuration error' });
                }
                req.userRolePermissions = roleContext.Permissions.map(p => p.permission_name);
            }

            if (req.userRolePermissions.includes(permissionName)) {
                return next();
            }

            return res.status(403).json({ message: 'Permission denied', required: permissionName });

        } catch (error) {
            console.error('RBAC Error:', error);
            return res.status(500).json({ message: 'RBAC check failed' });
        }
    };
};

/**
 * Middleware to check if the user has one of the required roles.
 * @param  {...string} allowedRoles 
 */
export const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
        }
        next();
    }
}
