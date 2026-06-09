import db from './src/models/index.js';
import { sendNotification } from './src/services/notification.service.js';

async function testVariousNotifications() {
    const userId = '019c79a4-4930-71fd-aa73-887301791935';
    const user = await db.User.findByPk(userId);

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('Found user:', user.name);

    const testEvents = [
        { type: 'JOB_ASSIGNMENT', data: { vesselName: 'Ocean Explorer', port: 'Singapore' } },
        { type: 'JOB_SENT_BACK', data: { vesselName: 'Ocean Explorer', remarks: 'Checklist incomplete' } },
        { type: 'INFO', data: { title: 'System Maintenance', message: 'Server will be down for 10 mins.' } }
    ];

    // Note: JOB_ASSIGNMENT might not be in my mapping, let's check JOB_ASSIGNED
    // I used JOB_ASSIGNED in formatter.

    const events = [
        { type: 'JOB_ASSIGNED', data: { vesselName: 'Ocean Explorer', port: 'Singapore' } },
        { type: 'JOB_SENT_BACK', data: { vesselName: 'Ocean Explorer', remarks: 'Checklist incomplete' } },
        { type: 'JOB_APPROVED', data: { vesselName: 'Ocean Explorer ' } }
    ];

    for (const event of events) {
        console.log(`Sending ${event.type}...`);
        await sendNotification(userId, event.type, event.data);
    }

    console.log('Done.');
    process.exit(0);
}

testVariousNotifications();
