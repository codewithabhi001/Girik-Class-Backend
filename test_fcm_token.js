import dotenv from 'dotenv';
dotenv.config();

import db from './src/models/index.js';
import firebaseApp from './src/config/firebase.js';
import { sendNotification } from './src/services/notification.service.js';

const targetEmail = 'abhivishwkarmaa52@gmail.com';
const targetToken = 'dX4gM0_KRnSDBCdfBmwtL-:APA91bGc08EcL5KadBdpJ7oaTgH2ubmoZYNONoSM7CSAXWURvYFQY4hGCfrK5TwwMeA2vztlSMhScX5Zm5D0lVbGf5A4MD_P2JxJ6MoaVDdD4C8A8FCEDZc';

async function runTest() {
    try {
        console.log('Connecting to database...');
        await db.sequelize.authenticate();
        console.log('Database connected successfully.');

        // Find user
        const user = await db.User.findOne({ where: { email: targetEmail } });
        if (!user) {
            console.error(`User with email ${targetEmail} not found!`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (ID: ${user.id})`);
        console.log(`Current FCM token in DB: ${user.fcm_token}`);

        // Update token
        if (user.fcm_token !== targetToken) {
            console.log(`Updating FCM token in database to: ${targetToken}`);
            await user.update({ fcm_token: targetToken });
            console.log('FCM token updated successfully.');
        } else {
            console.log('FCM token in DB already matches target token.');
        }

        // Test 1: Direct FCM Send
        if (!firebaseApp) {
            console.error('Firebase Admin SDK is not initialized! Check logs.');
            process.exit(1);
        }

        const fcmMessage = {
            notification: {
                title: 'FCM Test - Direct',
                body: 'This is a direct FCM notification from the test script.',
            },
            data: {
                eventType: 'INFO',
                title: 'FCM Test - Direct',
                message: 'This is a direct FCM notification from the test script.',
            },
            token: targetToken,
        };

        console.log('Sending notification directly via Firebase SDK...');
        const response = await firebaseApp.messaging().send(fcmMessage);
        console.log('Direct FCM Send Response:', response);

        // Test 2: Notification Service Send (which also updates database and sends emails if configured)
        console.log('Sending notification via sendNotification service...');
        await sendNotification(user.id, 'INFO', {
            title: 'FCM Test - Service',
            message: 'This notification was dispatched using the notification service.',
        });

        // Wait a few seconds for background promises to resolve
        console.log('Waiting 5 seconds for background services to complete...');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        console.log('Test completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during test execution:', error);
        process.exit(1);
    }
}

runTest();
