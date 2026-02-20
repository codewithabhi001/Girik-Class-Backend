'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Update surveys table
        await queryInterface.addColumn('surveys', 'submission_count', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });
        await queryInterface.addColumn('surveys', 'gps_latitude', {
            type: Sequelize.DECIMAL(10, 8),
            allowNull: true
        });
        await queryInterface.addColumn('surveys', 'gps_longitude', {
            type: Sequelize.DECIMAL(11, 8),
            allowNull: true
        });
        await queryInterface.addColumn('surveys', 'attendance_photo_url', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('surveys', 'survey_statement', {
            type: Sequelize.TEXT,
            allowNull: true
        });
        await queryInterface.addColumn('surveys', 'evidence_proof_url', {
            type: Sequelize.STRING,
            allowNull: true
        });

        // Update ENUM for survey_status
        // Note: MySQL ENUM update is tricky with queryInterface.changeColumn, 
        // sometimes it's better to use raw query for ENUMs in MySQL.
        await queryInterface.sequelize.query(`
      ALTER TABLE surveys MODIFY COLUMN survey_status ENUM(
        'NOT_STARTED', 'STARTED', 'CHECKLIST_SUBMITTED', 'PROOF_UPLOADED', 'SUBMITTED', 'REWORK_REQUIRED', 'FINALIZED'
      ) DEFAULT 'NOT_STARTED' NOT NULL;
    `);

        // 2. Create survey_status_histories table
        await queryInterface.createTable('survey_status_histories', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            survey_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'surveys',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            previous_status: {
                type: Sequelize.STRING,
                allowNull: true
            },
            new_status: {
                type: Sequelize.STRING,
                allowNull: false
            },
            submission_iteration: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false
            },
            changed_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION'
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('survey_status_histories', ['survey_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('survey_status_histories');
        await queryInterface.removeColumn('surveys', 'submission_count');
        await queryInterface.removeColumn('surveys', 'gps_latitude');
        await queryInterface.removeColumn('surveys', 'gps_longitude');
        await queryInterface.removeColumn('surveys', 'attendance_photo_url');
        await queryInterface.removeColumn('surveys', 'survey_statement');
        await queryInterface.removeColumn('surveys', 'evidence_proof_url');

        // Revert ENUM if possible, but ENUM shrinks are dangerous
    }
};
