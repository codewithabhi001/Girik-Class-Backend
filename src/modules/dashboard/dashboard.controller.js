import * as dashboardService from './dashboard.service.js';

/**
 * GET /dashboard
 * Returns role-specific dashboard data for the authenticated user.
 */
export const getDashboard = async (req, res, next) => {
    try {
        const data = await dashboardService.getDashboard(req.user);
        res.json(data);
    } catch (error) {
        next(error);
    }
};
