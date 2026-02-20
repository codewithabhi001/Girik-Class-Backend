'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('jobs', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            client_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            vessel_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'vessels',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            surveyor_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            job_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            job_status: {
                type: Sequelize.ENUM(
                    'CREATED', 'APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED', 'IN_PROGRESS', 'SURVEY_DONE',
                    'REVIEWED', 'FINALIZED', 'REWORK_REQUESTED', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'
                ),
                defaultValue: 'CREATED',
                allowNull: false
            },
            scheduled_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            completed_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION'
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

        await queryInterface.addIndex('jobs', ['client_id']);
        await queryInterface.addIndex('jobs', ['vessel_id']);
        await queryInterface.addIndex('jobs', ['job_status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('jobs');
    }
};
