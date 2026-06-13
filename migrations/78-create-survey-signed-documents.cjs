'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ─────────────────────────────────────────────────────────────────────
        // TABLE 2: survey_signed_documents
        // Each row = one signed document uploaded by a surveyor against a
        // specific template file for a specific job certificate.
        // Replaces the JSON array in surveys.signed_checklist_files.
        // ─────────────────────────────────────────────────────────────────────
        await queryInterface.createTable('survey_signed_documents', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false,
            },
            survey_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: { model: 'surveys', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            job_certificate_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: { model: 'job_certificates', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            template_file_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                comment: 'FK → checklist_template_files. NULL for legacy uploads migrated from JSON.',
                references: { model: 'checklist_template_files', key: 'id' },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            template_file_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Snapshot of template file name at upload time (in case template changes later)',
            },
            file_key: {
                type: Sequelize.STRING(500),
                allowNull: false,
                comment: 'S3 key of the surveyor-uploaded signed document',
            },
            file_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Human-readable file name for display',
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED', 'WAIVED'),
                allowNull: false,
                defaultValue: 'PENDING',
                comment: 'Review status set by TO/TM',
            },
            rejection_reason: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Mandatory when status = REJECTED',
            },
            reviewed_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            reviewed_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            submitted_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
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

        // Indexes for fast lookup
        await queryInterface.addIndex('survey_signed_documents', ['survey_id'], {
            name: 'idx_ssd_survey_id',
        });
        await queryInterface.addIndex('survey_signed_documents', ['job_certificate_id'], {
            name: 'idx_ssd_job_cert_id',
        });
        await queryInterface.addIndex('survey_signed_documents', ['template_file_id'], {
            name: 'idx_ssd_template_file_id',
        });
        await queryInterface.addIndex('survey_signed_documents', ['status'], {
            name: 'idx_ssd_status',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('survey_signed_documents');
    },
};
