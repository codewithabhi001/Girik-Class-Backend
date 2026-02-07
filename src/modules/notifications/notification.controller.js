import * as notificationService from '../../services/notification.service.js';

export const getNotifications = async (req, res, next) => {
    try {
        const list = await notificationService.getNotifications(req.user.id);
        res.json({
            success: true,
            message: 'Notifications fetched successfully',
            data: list
        });
    } catch (error) {
        next(error);
    }
};

export const markRead = async (req, res, next) => {
    try {
        const result = await notificationService.markRead(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Notification marked as read',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
