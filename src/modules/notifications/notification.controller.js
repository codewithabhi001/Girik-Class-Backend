import * as notificationService from '../../services/notification.service.js';

export const getNotifications = async (req, res, next) => {
    try {
        const list = await notificationService.getNotifications(req.user.id);
        res.json(list);
    } catch (error) {
        next(error);
    }
};

export const markRead = async (req, res, next) => {
    try {
        await notificationService.markRead(req.params.id, req.user.id);
        res.json({ message: 'Marked as read' });
    } catch (error) {
        next(error);
    }
};
