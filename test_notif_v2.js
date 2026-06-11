import db from './src/models/index.js';
import { sendNotification } from './src/services/notification.service.js';

async function testImageNotificationV2() {
    const email = 'info@grclass.com';
    const user = await db.User.findOne({ where: { email } });

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
    await sendNotification(user.id, event.type, event.data);

    console.log('Done.');
    process.exit(0);
}

testImageNotificationV2();
