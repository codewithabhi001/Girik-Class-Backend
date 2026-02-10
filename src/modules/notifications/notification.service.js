import db from '../../models/index.js';
import * as emailService from '../../services/email.service.js';
import logger from '../../utils/logger.js';

const Notification = db.Notification;
const NotificationPreference = db.NotificationPreference;
const User = db.User;

export const sendNotification = async (userId, eventType, data) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) return;

        const pref = await NotificationPreference.findOne({ where: { user_id: userId } });
        const matchesType = !pref || pref.alert_types.length === 0 || pref.alert_types.includes(eventType);

        const emailAllowed = !pref || (pref.email_enabled && matchesType);
        const appAllowed = !pref || (pref.app_enabled && matchesType);

        if (appAllowed) {
            await Notification.create({
                user_id: userId,
                title: data.title || eventType,
                message: data.message || 'New notification',
                type: eventType
            });
        }

        if (emailAllowed && user.email) {
            await emailService.sendTemplateEmail(user.email, eventType, data);
        }

    } catch (err) {
        logger.error(`Failed to send notification to user ${userId}`, err);
    }
};

export const createNotification = async (userId, title, message, type = 'INFO') => {
    return await sendNotification(userId, type, { title, message });
};

export const notifyRoles = async (roles, title, message, type = 'INFO') => {
    try {
        const users = await User.findAll({
            where: {
                role: roles
            }
        });

        for (const user of users) {
            await sendNotification(user.id, type, { title, message });
        }
    } catch (error) {
        logger.error('Error in notifyRoles:', error);
    }
};

export const getNotifications = async (userId) => {
    return await Notification.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 50
    });
};

export const markRead = async (id, userId) => {
    const notif = await Notification.findOne({ where: { id, user_id: userId } });
    if (notif) {
        await notif.update({ is_read: true });
    }
    return notif;
};

export const markAllRead = async (userId) => {
    return await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
};
