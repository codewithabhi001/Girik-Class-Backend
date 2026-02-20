'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('activity_requests', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            request_number: {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true
            },
            requested_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION'
            },
            vessel_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'vessels',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            activity_type: {
                type: Sequelize.ENUM('INSPECTION', 'AUDIT', 'TRAINING', 'VISIT', 'OTHER'),
                allowNull: false
            },
            requested_service: {
                type: Sequelize.STRING,
                allowNull: true
            },
            priority: {
                type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
                defaultValue: 'MEDIUM',
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            location_port: {
                type: Sequelize.STRING,
                allowNull: true
            },
            proposed_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED_TO_JOB', 'DRAFT'),
                defaultValue: 'PENDING',
                allowNull: false
            },
            linked_job_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'job_requests',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            rejection_reason: {
                type: Sequelize.STRING,
                allowNull: true
            },
            attachments: {
                type: Sequelize.JSON,
                defaultValue: [],
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        await queryInterface.addIndex('activity_requests', ['requested_by']);
        await queryInterface.addIndex('activity_requests', ['vessel_id']);
        await queryInterface.addIndex('activity_requests', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('activity_requests');
    }
};
