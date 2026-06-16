import * as systemIssuesService from './system_issues.service.js';

export const createReport = async (req, res, next) => {
    try {
        const userId = req.user?.id || null;
        const reportData = {
            ...req.body,
            user_id: userId
        };
        const result = await systemIssuesService.createReport(reportData);
        res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getReports = async (req, res, next) => {
    try {
        const result = await systemIssuesService.getReports(req.query);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const updateReportStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const resolverId = req.user.id;
        const result = await systemIssuesService.updateReportStatus(id, status, resolverId);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
