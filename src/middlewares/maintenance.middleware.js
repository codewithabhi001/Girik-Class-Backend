import { getMaintenanceMode } from '../modules/system/system.service.js';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const checkMaintenanceMode = async (req, res, next) => {
    try {
        // 1. Bypass check for critical system/auth status check routes
        const bypassPaths = [
            '/api/v1/health',
            '/api/v1/readiness',
            '/api/v1/version',
            '/api/v1/system/maintenance',
            '/api/v1/system/app-status',
            '/api/v1/auth/login',
            '/api/v1/system-issues' // Allow users/apps to submit crash reports even during maintenance
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
            let userRole = req.user?.role;
            if (!userRole && req.headers.authorization?.startsWith('Bearer ')) {
                const token = req.headers.authorization.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, env.jwt.accessSecret);
                    userRole = decoded.role;
                } catch (err) {
                    console.error('Maintenance auth bypass failed:', err.message);
                }
            }

            const staffRoles = ['ADMIN', 'GM', 'TM', 'TO']; // Internal staff bypass maintenance mode
            if (userRole && staffRoles.includes(userRole)) {
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
