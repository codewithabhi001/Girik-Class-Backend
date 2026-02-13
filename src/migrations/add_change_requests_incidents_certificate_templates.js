/**
 * Migration: Create change_requests, incidents, certificate_templates tables
 * Run: node src/migrations/add_change_requests_incidents_certificate_templates.js
 */

import db from '../models/index.js';

async function migrate() {
    try {
        await db.sequelize.authenticate();
        const queryInterface = db.sequelize.getQueryInterface();

        // Create change_requests if not exists
        const crExists = await db.sequelize.query(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'change_requests'"
        ).then(([r]) => r.length > 0);
        if (!crExists) {
            await queryInterface.createTable('change_requests', {
                id: { type: db.Sequelize.UUID, primaryKey: true },
                entity_type: { type: db.Sequelize.STRING },
                entity_id: { type: db.Sequelize.UUID },
                requested_by: { type: db.Sequelize.UUID },
                approved_by: { type: db.Sequelize.UUID, allowNull: true },
                change_description: { type: db.Sequelize.TEXT },
                old_value: { type: db.Sequelize.JSON },
                new_value: { type: db.Sequelize.JSON },
                status: { type: db.Sequelize.STRING, defaultValue: 'PENDING' },
                priority: { type: db.Sequelize.STRING, defaultValue: 'MEDIUM' },
                approval_remarks: { type: db.Sequelize.TEXT },
                approved_at: { type: db.Sequelize.DATE },
                created_at: { type: db.Sequelize.DATE, allowNull: false },
            });
            console.log('Created table change_requests');
        }

        // Create incidents if not exists
        const incExists = await db.sequelize.query(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'incidents'"
        ).then(([r]) => r.length > 0);
        if (!incExists) {
            await queryInterface.createTable('incidents', {
                id: { type: db.Sequelize.UUID, primaryKey: true },
                vessel_id: { type: db.Sequelize.UUID },
                reported_by: { type: db.Sequelize.UUID },
                title: { type: db.Sequelize.STRING },
                description: { type: db.Sequelize.TEXT },
                status: { type: db.Sequelize.STRING, defaultValue: 'OPEN' },
                remarks: { type: db.Sequelize.TEXT },
                created_at: { type: db.Sequelize.DATE, allowNull: false },
                updated_at: { type: db.Sequelize.DATE, allowNull: false },
            });
            console.log('Created table incidents');
        }

        // Create certificate_templates if not exists
        const ctExists = await db.sequelize.query(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'certificate_templates'"
        ).then(([r]) => r.length > 0);
        if (!ctExists) {
            await queryInterface.createTable('certificate_templates', {
                id: { type: db.Sequelize.UUID, primaryKey: true },
                certificate_type_id: { type: db.Sequelize.UUID },
                template_name: { type: db.Sequelize.STRING },
                template_content: { type: db.Sequelize.TEXT },
                variables: { type: db.Sequelize.JSON },
                is_active: { type: db.Sequelize.BOOLEAN, defaultValue: true },
                created_at: { type: db.Sequelize.DATE, allowNull: false },
                updated_at: { type: db.Sequelize.DATE, allowNull: false },
            });
            console.log('Created table certificate_templates');
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
