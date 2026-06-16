import { getMaintenanceMode } from '../modules/system/system.service.js';

export const checkMaintenanceMode = async (req, res, next) => {
    try {
        // 1. Bypass check for critical system/auth status check routes
        const bypassPaths = [
            '/health',
            '/readiness',
            '/version',
            '/system/maintenance',
            '/system/app-status',
            '/auth/login',
            '/system-issues' // Allow users/apps to submit crash reports even during maintenance
        ];

        // Clean query parameters and check prefix
        const requestPath = req.path;
        if (bypassPaths.some(p => requestPath === p || requestPath.startsWith(p))) {
            return next();
        }

        // 2. Fetch current maintenance status (uses in-memory 5s cache inside getMaintenanceMode)
        const maintenance = await getMaintenanceMode();

        if (maintenance.isMaintenance) {
            // 3. Bypass check for staff/admin roles.
            // If the request was optionally authenticated before this middleware, req.user will be set.
            const staffRoles = ['ADMIN', 'GM', 'TM', 'TO'];
            if (req.user && staffRoles.includes(req.user.role)) {
                return next();
            }

            // Return 503 Service Unavailable
            return res.status(503).json({
                success: false,
                isMaintenance: true,
                message: maintenance.message || 'System is currently undergoing maintenance. Please try again later.'
            });
        }

        next();
    } catch (error) {
        // Fail-safe: if settings fetch fails, let the request continue to prevent breaking the app on startup
        next();
    }
};
