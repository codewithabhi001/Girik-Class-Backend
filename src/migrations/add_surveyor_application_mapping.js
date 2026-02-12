/**
 * Migration: Add surveyor application <-> user mapping
 *
 * Links surveyor_applications to the user created on approval.
 * - surveyor_applications.approved_user_id -> users.id
 * - surveyor_profiles.surveyor_application_id -> surveyor_applications.id
 *
 * Usage: node src/migrations/add_surveyor_application_mapping.js
 */

import db from '../models/index.js';

async function migrate() {
    try {
        console.log('🔄 Starting migration: Add surveyor application mapping\n');

        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // 1. Add approved_user_id to surveyor_applications
        const [appCols] = await db.sequelize.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'surveyor_applications'
            AND COLUMN_NAME = 'approved_user_id'
        `);

        if (appCols.length === 0) {
            await db.sequelize.query(`
                ALTER TABLE surveyor_applications
                ADD COLUMN approved_user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
            `);
            await db.sequelize.query(`
                ALTER TABLE surveyor_applications
                ADD CONSTRAINT fk_surveyor_app_approved_user
                    FOREIGN KEY (approved_user_id) REFERENCES users(id) ON DELETE SET NULL
            `);
            console.log('✅ Added approved_user_id to surveyor_applications');
        } else {
            console.log('⏭️  approved_user_id already exists');
        }

        // 2. Add surveyor_application_id to surveyor_profiles
        const [profileCols] = await db.sequelize.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'surveyor_profiles'
            AND COLUMN_NAME = 'surveyor_application_id'
        `);

        if (profileCols.length === 0) {
            await db.sequelize.query(`
                ALTER TABLE surveyor_profiles
                ADD COLUMN surveyor_application_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
            `);
            await db.sequelize.query(`
                ALTER TABLE surveyor_profiles
                ADD CONSTRAINT fk_surveyor_profile_application
                    FOREIGN KEY (surveyor_application_id) REFERENCES surveyor_applications(id) ON DELETE SET NULL
            `);
            console.log('✅ Added surveyor_application_id to surveyor_profiles');
        } else {
            console.log('⏭️  surveyor_application_id already exists');
        }

        console.log('\n✅ Migration completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
