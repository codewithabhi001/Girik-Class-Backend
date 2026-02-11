/**
 * Migration: Add timestamps to activity_plannings table
 * 
 * This migration adds created_at and updated_at columns to the activity_plannings table
 * which are required by Sequelize when timestamps: true is set in the model.
 * 
 * Usage:
 * node src/migrations/add_timestamps_to_activity_plannings.js
 */

import db from '../models/index.js';

async function migrate() {
    try {
        console.log('🔄 Starting migration: Add timestamps to activity_plannings\n');

        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Check if columns already exist
        const [results] = await db.sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'activity_plannings' 
            AND COLUMN_NAME IN ('created_at', 'updated_at')
        `);

        if (results.length === 2) {
            console.log('⏭️  Timestamp columns already exist. Skipping migration.\n');
            process.exit(0);
        }

        console.log('📝 Adding timestamp columns...\n');

        // Add created_at column
        if (!results.find(r => r.COLUMN_NAME === 'created_at')) {
            await db.sequelize.query(`
                ALTER TABLE activity_plannings 
                ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✅ Added created_at column');
        }

        // Add updated_at column
        if (!results.find(r => r.COLUMN_NAME === 'updated_at')) {
            await db.sequelize.query(`
                ALTER TABLE activity_plannings 
                ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
            console.log('✅ Added updated_at column');
        }

        console.log('\n📊 Migration completed successfully!\n');

        // Verify the migration
        const [verify] = await db.sequelize.query(`
            DESCRIBE activity_plannings
        `);

        console.log('📋 Current table structure:');
        verify.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type}${col.Null === 'NO' ? ' NOT NULL' : ''}`);
        });

        console.log('\n✅ All done!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

// Run the migration
migrate();
