import db from './src/models/index.js';
import { sendNotification } from './src/services/notification.service.js';

async function testImageNotificationV2() {
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
            title: 'Image Test V2',
            message: 'Ye ek doosri photo ke saath test hai. Dekhiye image aayi ki nahi.',
            // Using a real image URL from Unsplash Source
            imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop'
        }
    };

    console.log(`Sending updated notification payload...`);
    await sendNotification(userId, event.type, event.data);

    console.log('Done.');
    process.exit(0);
}

testImageNotificationV2();
