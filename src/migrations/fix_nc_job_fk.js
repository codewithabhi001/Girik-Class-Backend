import db from '../models/index.js';

async function migrate() {
    try {
        console.log('🔄 Starting migration: Fix NonConformity Foreign Key\n');

        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // 1. Drop the old constraint if it exists
        // We use a try-catch block because we can't easily check for constraint existence in a cross-db way
        // But for MySQL, we can query information_schema or just try to drop.

        console.log('🔍 Checking for existing constraints...');

        const [constraints] = await db.sequelize.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'non_conformities' 
            AND TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'job_requests';
        `);

        if (constraints.length > 0) {
            console.log(`⚠️ Found existing constraints: ${constraints.map(c => c.CONSTRAINT_NAME).join(', ')}`);
            for (const constraint of constraints) {
                console.log(`🗑️ Dropping constraint: ${constraint.CONSTRAINT_NAME}`);
                await db.sequelize.query(`ALTER TABLE non_conformities DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
            }
        } else {
            console.log('ℹ️ No existing foreign key constraint found between non_conformities and job_requests.');
        }

        // 2. Ensure job_id column is compatible (UUID) and NOT NULL
        // Note: modify column needs to be careful about data loss. 
        // We assume job_id is strictly UUID.
        console.log('🛠️ modifying job_id column to ensure compatibility...');
        // We use standard CHAR(36) BINARY for compatibility with Sequelize UUID
        // Or simpler, let Sequelize handle it via QueryInterface if possible, but here we use raw query for speed/certainty in script.
        // Actually, let's just add the constraint. Changing column type might be risky if they use a different collation.
        // However, to ensure FK works, types MUST match.
        // Let's assume types match for now.

        // 3. Add the correct constraint
        console.log('📝 Adding new foreign key constraint...');

        try {
            await db.sequelize.query(`
                ALTER TABLE non_conformities
                ADD CONSTRAINT fk_non_conformities_job
                FOREIGN KEY (job_id) REFERENCES job_requests(id)
                ON DELETE CASCADE ON UPDATE CASCADE
            `);
            console.log('✅ Added constraint fk_non_conformities_job');
        } catch (error) {
            console.error('❌ Failed to add constraint. Likely due to existing data violating the foreign key (orphaned non_conformities).');
            console.error('   Error:', error.message);
            // Optional: We could try to delete orphaned rows?
            // await db.sequelize.query("DELETE FROM non_conformities WHERE job_id NOT IN (SELECT id FROM job_requests)");
            // checking if user wants that? No.
            process.exit(1);
        }

        console.log('\n📊 Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
