'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('change_requests', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            entity_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            entity_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false
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
            approved_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            change_description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            old_value: {
                type: Sequelize.JSON,
                allowNull: true
            },
            new_value: {
                type: Sequelize.JSON,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
                defaultValue: 'PENDING',
                allowNull: false
            },
            priority: {
                type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH'),
                defaultValue: 'MEDIUM',
                allowNull: false
            },
            approval_remarks: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('change_requests', ['entity_type', 'entity_id']);
        await queryInterface.addIndex('change_requests', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('change_requests');
    }
};
