import * as dashboardService from './dashboard.service.js';

export const getDashboard = async (req, res, next) => {
    try {
        const { user } = req;
        let data;
        switch (user.role) {
            case 'ADMIN':
                data = await dashboardService.getAdminDashboard();
                break;
            case 'GM':
                data = await dashboardService.getGMDashboard();
                break;
            case 'TM':
                data = await dashboardService.getTMDashboard();
                break;
            case 'TO':
                data = await dashboardService.getTODashboard(user);
                break;
            case 'TA':
                data = await dashboardService.getTADashboard(user);
                break;
            case 'SURVEYOR':
                data = await dashboardService.getSurveyorDashboard(user);
                break;
            case 'CLIENT':
                data = await dashboardService.getClientDashboard(user.client_id || user.id);
                break;
            case 'FLAG_ADMIN':
                data = await dashboardService.getFlagAdminDashboard();
                break;
            default:
                data = await dashboardService.getDefaultDashboard(user);
        }
        res.json({ success: true, data });
    } catch (error) { next(error); }
};
