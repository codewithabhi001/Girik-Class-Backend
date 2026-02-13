/**
 * Migration: Add IN_PROGRESS to job_requests.job_status ENUM
 *
 * The survey flow and status update API use job_status 'IN_PROGRESS', but the
 * column ENUM did not include it, so updates failed. This adds the value.
 *
 * Usage:
 * node src/migrations/add_in_progress_to_job_status_enum.js
 */

import db from '../models/index.js';

const JOB_STATUS_ENUM =
    "ENUM('CREATED','GM_APPROVED','TM_PRE_APPROVED','ASSIGNED','IN_PROGRESS','SURVEY_DONE','TO_APPROVED','TM_FINAL','PAYMENT_DONE','CERTIFIED','REJECTED')";

async function migrate() {
    try {
        console.log('🔄 Starting migration: Add IN_PROGRESS to job_status ENUM\n');

        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        const [cols] = await db.sequelize.query(`
            SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_requests' AND COLUMN_NAME = 'job_status'
        `);

        if (!cols.length) {
            console.log('⏭️  job_requests.job_status not found. Skipping.\n');
            process.exit(0);
        }

        const currentType = cols[0].COLUMN_TYPE;
        if (currentType && currentType.toUpperCase().includes("'IN_PROGRESS'")) {
            console.log('⏭️  IN_PROGRESS already in job_status ENUM. Skipping.\n');
            process.exit(0);
        }

        console.log('📝 Modifying job_status column to include IN_PROGRESS...\n');

        await db.sequelize.query(`
            ALTER TABLE job_requests MODIFY COLUMN job_status ${JOB_STATUS_ENUM}
        `);

        console.log('✅ job_status ENUM updated.\n');
        console.log('📊 Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

migrate();
