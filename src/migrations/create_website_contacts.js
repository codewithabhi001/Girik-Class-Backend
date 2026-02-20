/**
 * Migration: Create website_contacts table
 *
 * Stores contact form submissions from the Girik portfolio website.
 * Visitors fill in the contact form (no login required) and admin/GM
 * can manage these enquiries via the backend dashboard.
 *
 * Usage:
 *   node src/migrations/create_website_contacts.js
 */

import db from '../models/index.js';

async function migrate() {
    try {
        console.log('🔄 Starting migration: Create website_contacts table\n');

        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // ── Guard: skip if table already exists ────────────────────────────
        const [tableExists] = await db.sequelize.query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'website_contacts'
        `);

        if (tableExists.length > 0) {
            console.log('⏭️  Table website_contacts already exists. Skipping.\n');
            process.exit(0);
        }

        // ── Create table ───────────────────────────────────────────────────
        console.log('📝 Creating website_contacts table...');

        await db.sequelize.query(`
            CREATE TABLE website_contacts (
                id               CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                full_name        VARCHAR(100)    NOT NULL,
                company          VARCHAR(150)    NULL,
                corporate_email  VARCHAR(255)    NOT NULL,
                message          TEXT            NOT NULL,
                phone            VARCHAR(30)     NULL,
                subject          VARCHAR(200)    NULL,
                status           ENUM('NEW','READ','REPLIED','ARCHIVED')
                                                NOT NULL DEFAULT 'NEW',
                internal_note    TEXT            NULL
                                 COMMENT 'Admin/GM internal note about this enquiry',
                replied_by       CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
                replied_at       DATETIME        NULL,
                ip_address       VARCHAR(50)     NULL
                                 COMMENT 'Originating IP for spam control',
                source_page      VARCHAR(50)     NULL DEFAULT 'CONTACT',
                created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                CONSTRAINT fk_website_contacts_replied_by
                    FOREIGN KEY (replied_by)
                    REFERENCES users(id)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Table created successfully\n');

        // ── Indexes ────────────────────────────────────────────────────────
        console.log('📝 Adding indexes...');

        await db.sequelize.query(`
            ALTER TABLE website_contacts
                ADD INDEX idx_website_contacts_status     (status),
                ADD INDEX idx_website_contacts_email      (corporate_email),
                ADD INDEX idx_website_contacts_created_at (created_at);
        `);

        console.log('✅ Indexes added\n');

        // ── Verify ─────────────────────────────────────────────────────────
        const [columns] = await db.sequelize.query(`DESCRIBE website_contacts`);
        console.log('📊 Migration completed successfully!');
        console.log('Table structure:');
        columns.forEach(c => console.log(`  ${c.Field.padEnd(20)} ${c.Type}`));
        console.log('\n💡 Next step: Restart the server — the new /api/v1/contact routes are live.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

migrate();
