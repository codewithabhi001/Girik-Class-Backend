import db from '../models/index.js';

async function migrate() {
    try {
        console.log('🔄 Starting migration: Add file_url to activity_plannings\n');

        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Check if column exists
        const [results] = await db.sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'activity_plannings' 
            AND COLUMN_NAME = 'file_url'
        `);

        if (results.length > 0) {
            console.log('⏭️  Column file_url already exists. Skipping migration.\n');
            process.exit(0);
        }

        console.log('📝 Adding file_url column...\n');

        await db.sequelize.query(`
            ALTER TABLE activity_plannings 
            ADD COLUMN file_url VARCHAR(255) DEFAULT NULL
        `);
        console.log('✅ Added file_url column');

        console.log('\n📊 Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
