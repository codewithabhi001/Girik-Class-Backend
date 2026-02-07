import bcrypt from 'bcrypt';
import db from '../models/index.js';

const seed = async () => {
    try {
        await db.sequelize.sync({ force: true }); // Reset DB for seeding
        console.log('Database synced');

        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);

        // 1. Admin User
        await db.User.create({
            name: 'Super Admin',
            email: 'admin@girik.com',
            password_hash: adminPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            phone: '1234567890'
        });
        console.log('Admin user seeded');

        // 2. Sample Client
        const client = await db.Client.create({
            company_name: 'Maersk Line',
            company_code: 'MAERSK',
            email: 'info@maersk.com',
            status: 'ACTIVE'
        });
        console.log('Client seeded');

        // 3. Sample Flag Admin
        await db.User.create({
            name: 'Flag Admin',
            email: 'flag@panama.com',
            password_hash: adminPassword,
            role: 'FLAG_ADMIN',
            status: 'ACTIVE'
        });
        console.log('Flag Admin seeded');

        // 4. Sample Surveyor
        const surveyorUser = await db.User.create({
            name: 'John Surveyor',
            email: 'surveyor@girik.com',
            password_hash: adminPassword,
            role: 'SURVEYOR',
            status: 'ACTIVE'
        });

        await db.SurveyorProfile.create({
            user_id: surveyorUser.id,
            license_number: 'SURV-001',
            status: 'ACTIVE'
        });
        console.log('Surveyor seeded');

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
