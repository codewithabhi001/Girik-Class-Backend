/**
 * Migration: Add certificate_type_id to checklist_templates
 * 
 * This migration adds the certificate_type_id column to link checklist templates
 * with specific certificate types.
 * 
 * Usage:
 * node src/migrations/add_certificate_type_to_checklist_templates.js
 */

import db from '../models/index.js';

async function migrate() {
    try {
        console.log('🔄 Starting migration: Add certificate_type_id to checklist_templates\n');

        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Check if column already exists
        const [results] = await db.sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'checklist_templates' 
            AND COLUMN_NAME = 'certificate_type_id'
        `);

        if (results.length > 0) {
            console.log('⏭️  Column certificate_type_id already exists. Skipping migration.\n');
            process.exit(0);
        }

        console.log('📝 Adding certificate_type_id column...');

        // Add the column with correct data type
        await db.sequelize.query(`
            ALTER TABLE checklist_templates 
            MODIFY COLUMN certificate_type_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
            COMMENT 'Links template to a specific certificate type'
        `);

        console.log('✅ Column added successfully\n');

        // Add foreign key constraint
        console.log('📝 Adding foreign key constraint...');

        await db.sequelize.query(`
            ALTER TABLE checklist_templates 
            ADD CONSTRAINT fk_checklist_template_cert_type 
            FOREIGN KEY (certificate_type_id) 
            REFERENCES certificate_types(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        console.log('✅ Foreign key constraint added successfully\n');

        // Verify the migration
        const [verify] = await db.sequelize.query(`
            DESCRIBE checklist_templates certificate_type_id
        `);

        console.log('📊 Migration completed successfully!');
        console.log('Column details:', verify[0]);
        console.log('\n💡 Next step: Run the checklist templates seeder');
        console.log('   node src/seeders/seed_checklist_templates.js\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

// Run the migration
migrate();
