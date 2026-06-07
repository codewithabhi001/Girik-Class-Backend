'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ─────────────────────────────────────────────────────────────────────
        // TABLE 1: checklist_template_files
        // Each row = one blank master template document belonging to a
        // ChecklistTemplate. Replaces the JSON array in
        // checklist_templates.template_files.
        // ─────────────────────────────────────────────────────────────────────
        await queryInterface.createTable('checklist_template_files', {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
                charset: 'utf8mb4',
                collate: 'utf8mb4_bin',
            },
            checklist_template_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                charset: 'utf8mb4',
                collate: 'utf8mb4_bin',
                references: { model: 'checklist_templates', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Display name e.g. "Safety Management Plan"',
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Optional description / instructions for this file',
            },
            file_key: {
                type: Sequelize.STRING(500),
                allowNull: true,
                comment: 'S3 key of the blank master template (to be filled by surveyor)',
            },
            display_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Sort order shown to surveyor (0 = first)',
            },
            is_mandatory: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Surveyor must upload a signed version before submitting',
            },
            created_by: {
                type: Sequelize.CHAR(36),
                allowNull: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_bin',
                references: { model: 'users', key: 'id' },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Index for fast lookup by template
        await queryInterface.addIndex('checklist_template_files', ['checklist_template_id'], {
            name: 'idx_ctf_template_id',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('checklist_template_files');
    },
};
