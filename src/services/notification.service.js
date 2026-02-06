
import db from '../models/index.js';
import * as emailService from './email.service.js';
import logger from '../utils/logger.js';

const Notification = db.Notification;
const NotificationPreference = db.NotificationPreference;
const User = db.User;

/**
 * Core notification dispatch logic
 * @param {string} userId 
 * @param {string} eventType - e.g. SLA_BREACH, INFO, JOB_ASSIGNMENT
 * @param {object} data - { title, message, ...otherDetails }
 */
export const sendNotification = async (userId, eventType, data) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) return;

        const pref = await NotificationPreference.findOne({ where: { user_id: userId } });

        // Logic: Enabled if no preference set, or if explicitly enabled
        // If alert_types is empty array, it implies "ALL" (default behavior) or maybe "NONE"? 
        // Typically empty whitelist means specific filtering is OFF, so allow all.
        const matchesType = !pref || pref.alert_types.length === 0 || pref.alert_types.includes(eventType);

        const emailAllowed = !pref || (pref.email_enabled && matchesType);
        const appAllowed = !pref || (pref.app_enabled && matchesType);

        // 1. In-App Notification
        if (appAllowed) {
            await Notification.create({
                user_id: userId,
                title: data.title || eventType, // Fallback title
                message: data.message || 'New notification',
                type: eventType
            });
        }

        // 2. Email Notification
        if (emailAllowed && user.email) {
            await emailService.sendTemplateEmail(user.email, eventType, data);
        }

    } catch (err) {
        logger.error(`Failed to send notification to user ${userId}`, err);
    }
};

/**
 * Legacy/Simple wrapper for creating a single notification
 */
export const createNotification = async (userId, title, message, type = 'INFO') => {
    return await sendNotification(userId, type, { title, message });
};

/**
 * Notify all users with specific roles
 */
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
        limit: 20
    });
};

export const markRead = async (id, userId) => {
    const notif = await Notification.findOne({ where: { id, user_id: userId } });
    if (notif) {
        await notif.update({ is_read: true });
    }
    return notif;
};
