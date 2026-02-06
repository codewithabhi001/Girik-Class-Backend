import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import db from '../models/index.js';

const seed = async () => {
    try {
        await db.sequelize.sync({ force: true }); // Reset DB for seeding
        console.log('Database synced');

        // 1. Roles
        const rolesData = [
            { role_name: 'ADMIN', description: 'System Administrator' },
            { role_name: 'GM', description: 'General Manager' },
            { role_name: 'TM', description: 'Technical Manager' },
            { role_name: 'TO', description: 'Technical Officer' },
            { role_name: 'TA', description: 'Technical Assistant' },
            { role_name: 'SURVEYOR', description: 'Field Surveyor' },
            { role_name: 'CLIENT', description: 'Customer' },
            { role_name: 'FLAG_ADMIN', description: 'Flag State Administrator' }
        ];

        const roles = await db.Role.bulkCreate(rolesData);
        console.log('Roles seeded');

        // 2. Permissions (Sample)
        const permissionsData = [
            { permission_name: 'MANAGE_USERS', description: 'Create, update, delete users' },
            { permission_name: 'APPROVE_JOB', description: 'Approve job requests' },
            { permission_name: 'VIEW_REPORTS', description: 'View survey reports' },
        ];

        const permissions = await db.Permission.bulkCreate(permissionsData);
        console.log('Permissions seeded');

        // 3. Admin User
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);

        const adminUser = await db.User.create({
            name: 'Super Admin',
            email: 'admin@girik.com',
            password_hash: adminPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            phone: '1234567890'
        });
        console.log('Admin user seeded');

        // 4. Sample Client
        const client = await db.Client.create({
            company_name: 'Maersk Line',
            company_code: 'MAERSK',
            email: 'info@maersk.com',
            status: 'ACTIVE'
        });
        console.log('Client seeded');

        // 5. Sample Flag Admin
        const flagAdminUser = await db.User.create({
            name: 'Flag Admin',
            email: 'flag@panama.com',
            password_hash: adminPassword,
            role: 'FLAG_ADMIN',
            status: 'ACTIVE'
        });
        console.log('Flag Admin seeded');

        // 6. Sample Surveyor
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
