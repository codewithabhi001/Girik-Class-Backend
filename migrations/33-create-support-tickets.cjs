'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('support_tickets', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            user_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            subject: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
                defaultValue: 'OPEN',
                allowNull: false
            },
            priority: {
                type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
                defaultValue: 'MEDIUM',
                allowNull: false
            },
            category: {
                type: Sequelize.STRING,
                allowNull: true
            },
            resolved_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            resolved_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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

        await queryInterface.addIndex('support_tickets', ['user_id']);
        await queryInterface.addIndex('support_tickets', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('support_tickets');
    }
};
