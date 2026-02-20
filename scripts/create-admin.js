/**
 * Create admin user: admin@girik.com / admin123
 * Run: node scripts/create-admin.js
 */
import db from '../src/models/index.js';
import bcrypt from 'bcrypt';

const EMAIL = 'admin@girik.com';
const PASSWORD = 'admin123';
const NAME = 'Admin';

const run = async () => {
    try {
        const existing = await db.User.findOne({ where: { email: EMAIL } });
        const password_hash = await bcrypt.hash(PASSWORD, 10);

        if (existing) {
            await existing.update({ password_hash, role: 'ADMIN', status: 'ACTIVE', name: NAME });
            console.log('Admin user updated:', EMAIL);
        } else {
            await db.User.create({
                name: NAME,
                email: EMAIL,
                password_hash,
                role: 'ADMIN',
                status: 'ACTIVE',
            });
            console.log('Admin user created:', EMAIL);
        }
        console.log('Done. Login with email:', EMAIL, 'password:', PASSWORD);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
