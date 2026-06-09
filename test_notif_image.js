import db from './src/models/index.js';
import { sendNotification } from './src/services/notification.service.js';

async function testImageNotification() {
    const userId = '019c79a4-4930-71fd-aa73-887301791935';
    const user = await db.User.findByPk(userId);

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('Found user:', user.name);

    const event = {
        type: 'INFO',
        data: {
            title: 'Visual Update!',
            message: 'Ye image ke saath notification ka demo hai. Aap ab in-push notifications mein badi photos bhi bhej sakte hain.',
            imageUrl: 'https://via.placeholder.com/1200x600/2c3e50/ffffff?text=Notification+With+Image+Demo'
        }
    };

    console.log(`Sending notification with image...`);
    await sendNotification(userId, event.type, event.data);

    console.log('Done.');
    process.exit(0);
}

testImageNotification();
