import db from './src/models/index.js';
import bcrypt from 'bcrypt';
import env from './src/config/env.js';

async function setupAdmin() {
    try {
        console.log('Deleting all users...');
        await db.User.destroy({ where: {} });

        console.log('Creating info@grclass.com user...');
        const saltRounds = env.bcryptSaltRounds || 10;
        const password_hash = await bcrypt.hash('Password@123', saltRounds);

        await db.User.create({
            name: 'Admin',
            email: 'info@grclass.com',
            password_hash,
            role: 'ADMIN',
            status: 'ACTIVE'
        });

        console.log('Admin user setup successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up admin user:', error);
        process.exit(1);
    }
}

setupAdmin();
