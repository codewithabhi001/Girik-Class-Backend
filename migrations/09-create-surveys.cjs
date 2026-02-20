'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('surveys', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            job_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                unique: true,
                references: {
                    model: 'job_requests',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            surveyor_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION'
            },
            survey_status: {
                type: Sequelize.ENUM(
                    'NOT_STARTED', 'STARTED', 'CHECKLIST_SUBMITTED', 'PROOF_UPLOADED', 'SUBMITTED', 'FINALIZED'
                ),
                defaultValue: 'NOT_STARTED',
                allowNull: false
            },
            started_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            submitted_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            finalized_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('surveys', ['job_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('surveys');
    }
};
