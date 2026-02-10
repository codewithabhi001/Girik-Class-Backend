import * as mobileService from './mobile.service.js';

export const syncData = async (req, res, next) => {
    try {
        const results = await mobileService.syncOfflineData(
            req.user.id,
            req.body.offline_data || []
        );
        res.json({ success: true, status: 'SYNCED', ...results });
    } catch (error) { next(error); }
};

export const getOfflineJobs = async (req, res, next) => {
    try {
        const jobs = await mobileService.getOfflineJobs(req.user.id);
        res.json({ success: true, data: { jobs } });
    } catch (error) { next(error); }
};

export const submitOfflineSurveys = async (req, res, next) => {
    try {
        const results = await mobileService.syncOfflineData(
            req.user.id,
            req.body.surveys || []
        );
        res.json({ success: true, message: 'Surveys queued', ...results });
    } catch (error) { next(error); }
};
