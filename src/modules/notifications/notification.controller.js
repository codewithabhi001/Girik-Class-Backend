import * as notificationService from './notification.service.js';

export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await notificationService.getNotifications(req.user.id);
        res.json({ success: true, data: notifications });
    } catch (e) { next(e); }
};

export const markRead = async (req, res, next) => {
    try {
        const result = await notificationService.markRead(req.params.id, req.user.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const markAllRead = async (req, res, next) => {
    try {
        const result = await notificationService.markAllRead(req.user.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
