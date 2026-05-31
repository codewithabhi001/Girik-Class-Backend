import firebaseApp from '../config/firebase.js';
import db from '../models/index.js';
import * as emailService from './email.service.js';
import logger from '../utils/logger.js';
import { formatNotification } from '../utils/notification.formatter.js';

const Notification = db.Notification;
const NotificationPreference = db.NotificationPreference;
const User = db.User;

/**
 * Core notification dispatch logic
 * @param {string} userId 
 * @param {string} eventType - e.g. SLA_BREACH, INFO, JOB_ASSIGNMENT
 * @param {object} data - { title, message, ...otherDetails }
 */
export const sendNotification = async (userId, eventType, data = {}, userObj = null) => {
    try {
        const user = userObj || await User.findByPk(userId);
        if (!user) return;

        const pref = await NotificationPreference.findOne({ where: { user_id: user.id } });

        // Logic: Enabled if no preference set, or if explicitly enabled
        const matchesType = !pref || pref.alert_types.length === 0 || pref.alert_types.includes(eventType);

        const emailAllowed = !pref || (pref.email_enabled && matchesType);
        const appAllowed = !pref || (pref.app_enabled && matchesType);

        // Populate title and message if not present
        const formatted = formatNotification(eventType, data);
        data.title = data.title || formatted.title;
        data.message = data.message || formatted.message;

        const promises = [];

        // 1. In-App Notification (Database)
        if (appAllowed) {
            promises.push(Notification.create({
                user_id: user.id,
                title: data.title,
                message: data.message,
                type: eventType
            }));
        }

        // 2. Push Notification (Firebase FCM)
        if (appAllowed && user.fcm_token && firebaseApp) {
            const fcmMessage = {
                notification: {
                    title: data.title,
                    body: data.message,
                    ...(data.imageUrl && { image: data.imageUrl })
                },
                data: {
                    eventType: eventType,
                    ...Object.fromEntries(
                        Object.entries(data).map(([k, v]) => [k, String(v)])
                    )
                },
                android: {
                    notification: {
                        ...(data.imageUrl && { image: data.imageUrl }),
                        priority: 'high',
                        sound: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            'mutable-content': 1,
                            sound: 'default'
                        }
                    },
                    fcm_options: {
                        ...(data.imageUrl && { image: data.imageUrl })
                    }
                },
                token: user.fcm_token,
            };
            promises.push(firebaseApp.messaging().send(fcmMessage).catch(fcmError => {
                logger.error(`Failed to send FCM notification to user ${user.id}:`, fcmError);
                if (fcmError.code === 'messaging/registration-token-not-registered' ||
                    fcmError.code === 'messaging/invalid-registration-token') {
                    user.update({ fcm_token: null }).catch(e => logger.error('Clear FCM token fail:', e));
                }
            }));
        }

        // 3. Email Notification
        if (emailAllowed && user.email) {
            promises.push(emailService.sendTemplateEmail(user.email, eventType, data).catch(e => logger.error('Email fail:', e)));
        }

        // Dispatch and move on (Background)
        Promise.allSettled(promises);

    } catch (err) {
        logger.error(`Failed to send notification to user ${userId}`, err);
    }
};

/**
 * Legacy/Simple wrapper for creating a single notification
 */
export const createNotification = async (userId, title, message, type = 'INFO') => {
    return console.log("Mock sending notification"); // await sendNotification(userId, type, { title, message });
};

/**
 * Notify all users with specific roles
 */
export const notifyRoles = async (roles, eventOrTitle, dataOrMessage = {}, extraType = 'INFO') => {
    try {
        let title, message, type;

        if (typeof dataOrMessage === 'object' && dataOrMessage !== null) {
            // New Event-driven pattern: (roles, eventType, data)
            const formatted = formatNotification(eventOrTitle, dataOrMessage);
            title = dataOrMessage.title || formatted.title;
            message = dataOrMessage.message || formatted.message;
            type = eventOrTitle;
        } else {
            // Legacy pattern: (roles, title, message, type)
            title = eventOrTitle;
            message = dataOrMessage;
            type = extraType;
        }

        const users = await User.findAll({
            where: { role: roles },
            include: [{ model: NotificationPreference, as: 'NotificationPreference' }]
        });

        if (users.length === 0) return;

        const notificationsToCreate = [];
        const pushPromises = [];
        const emailPromises = [];

        for (const user of users) {
            const pref = user.NotificationPreference;
            const matchesType = !pref || pref.alert_types.length === 0 || pref.alert_types.includes(type);
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

            // Push Notification (Firebase FCM)
            if (appAllowed && user.fcm_token && firebaseApp) {
                const fcmMsg = {
                    notification: { title, body: message },
                    data: { eventType: type, title, message },
                    android: {
                        notification: {
                            priority: 'high',
                            sound: 'default'
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                'mutable-content': 1,
                                sound: 'default'
                            }
                        }
                    },
                    token: user.fcm_token
                };
                pushPromises.push(
                    firebaseApp.messaging().send(fcmMsg)
                        .catch(err => logger.error(`FCM error for user ${user.id}:`, err))
                );
            }

            // Email Notification
            if (emailAllowed && user.email) {
                const emailData = typeof dataOrMessage === 'object' ? { ...dataOrMessage, title, message } : { title, message };
                emailPromises.push(
                    emailService.sendTemplateEmail(user.email, type, emailData)
                        .catch(err => logger.error(`Email error for user ${user.id}:`, err))
                );
            }
        }

        // 1. Bulk Insert Database Notifications (Single Query)
        if (notificationsToCreate.length > 0) {
            await Notification.bulkCreate(notificationsToCreate);
        }

        // 2. Trigger Push & Email concurrently (Background)
        Promise.allSettled([...pushPromises, ...emailPromises]);

    } catch (error) {
        logger.error('Error in notifyRoles:', error);
    }
};

export const getNotifications = async (userId) => {
    return await Notification.findAll({
        where: { user_id: userId },
        attributes: ['id', 'title', 'message', 'type', 'is_read', 'created_at'],
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
