import db from '../../models/index.js';
import * as emailService from '../../services/email.service.js';
import logger from '../../utils/logger.js';
import * as websocketService from '../../services/websocket.service.js';

const Notification = db.Notification;
const NotificationPreference = db.NotificationPreference;
const User = db.User;

const DEFAULT_ALERT_TYPES = [
    'JOB_CREATED',
    'JOB_DOCUMENT_VERIFIED',
    'JOB_APPROVED',
    'JOB_ASSIGNED',
    'JOB_RESCHEDULED',
    'JOB_REVIEWED',
    'JOB_SENT_BACK',
    'JOB_FINALIZED',
    'SURVEY_STARTED',
    'SURVEY_SUBMITTED',
    'SURVEY_PROOF_UPLOADED',
    'SURVEY_REWORK_REQUESTED',
    'INFO'
];

export const getPreferences = async (userId) => {
    const [pref] = await NotificationPreference.findOrCreate({
        where: { user_id: userId },
        defaults: {
            user_id: userId,
            email_enabled: true,
            app_enabled: true,
            alert_types: DEFAULT_ALERT_TYPES
        },
        useMaster: true
    });
    return pref;
};

export const updatePreferences = async (userId, data) => {
    const pref = await getPreferences(userId);
    await pref.update({
        email_enabled: data.email_enabled !== undefined ? data.email_enabled : pref.email_enabled,
        app_enabled: data.app_enabled !== undefined ? data.app_enabled : pref.app_enabled,
        alert_types: data.alert_types !== undefined ? data.alert_types : pref.alert_types
    });
    return pref;
};

export const sendNotification = async (userId, eventType, data) => {
    try {
        const user = await User.findByPk(userId, { useMaster: true });
        if (!user) return;

        const pref = await NotificationPreference.findOne({ where: { user_id: userId }, useMaster: true });
        const matchesType = !pref || (Array.isArray(pref.alert_types) && pref.alert_types.includes(eventType));

        const emailAllowed = !pref || (pref.email_enabled && matchesType);
        const appAllowed = !pref || (pref.app_enabled && matchesType);

        if (appAllowed) {
            const notif = await Notification.create({
                user_id: userId,
                title: data.title || eventType,
                message: data.message || 'New notification',
                type: eventType
            });

            // Emit live WebSocket notification
            try {
                websocketService.emitToUser(userId, 'notification:received', {
                    id: notif.id,
                    title: notif.title,
                    message: notif.message,
                    type: notif.type,
                    created_at: notif.created_at || notif.createdAt
                });
            } catch (wsErr) {
                logger.error('[WebSocket] Live notification emit failed:', wsErr);
            }
        }

        if (emailAllowed && user.email) {
            // Don't await email - send in background
            emailService.sendTemplateEmail(user.email, eventType, data)
                .catch(err => logger.error(`Background Email error for user ${userId}:`, err));
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
            where: { role: roles },
            include: [{ model: NotificationPreference, as: 'NotificationPreference' }]
        });

        if (users.length === 0) return;

        const notificationsToCreate = [];
        const emailPromises = [];

        for (const user of users) {
            const pref = user.NotificationPreference;
            const matchesType = !pref || (Array.isArray(pref.alert_types) && pref.alert_types.includes(type));
            const emailAllowed = !pref || (pref.email_enabled && matchesType);
            const appAllowed = !pref || (pref.app_enabled && matchesType);

            if (appAllowed) {
                notificationsToCreate.push({
                    user_id: user.id,
                    title: title,
                    message: message,
                    type: type
                });
            }

            if (emailAllowed && user.email) {
                emailPromises.push(
                    emailService.sendTemplateEmail(user.email, type, { title, message })
                        .catch(err => logger.error(`Email error for user ${user.id}:`, err))
                );
            }
        }

        // 1. Bulk Insert Database Notifications
        if (notificationsToCreate.length > 0) {
            await Notification.bulkCreate(notificationsToCreate);

            // Emit live WebSocket notifications to roles
            try {
                roles.forEach(role => {
                    websocketService.emitToRole(role, 'notification:received', {
                        title,
                        message,
                        type,
                        created_at: new Date()
                    });
                });
            } catch (wsErr) {
                logger.error('[WebSocket] Live notification emit to roles failed:', wsErr);
            }
        }

        // 2. Trigger Emails concurrently in background
        Promise.allSettled(emailPromises);

    } catch (error) {
        logger.error('Error in notifyRoles:', error);
    }
};

export const getNotifications = async (userId) => {
    return await Notification.findAll({
        where: { user_id: userId },
        attributes: ['id', 'title', 'message', 'type', 'is_read', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 50,
        useReplica: true
    });
};

export const markRead = async (id, userId) => {
    const notif = await Notification.findOne({ where: { id, user_id: userId }, useMaster: true });
    if (notif) {
        await notif.update({ is_read: true });
    }
    return notif;
};

export const markAllRead = async (userId) => {
    return await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
};
