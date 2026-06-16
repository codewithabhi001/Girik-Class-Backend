'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('system_issue_reports', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            user_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            stack_trace: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            page_url: {
                type: Sequelize.STRING(2048),
                allowNull: true
            },
            user_agent: {
                type: Sequelize.STRING(1024),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED'),
                defaultValue: 'OPEN',
                allowNull: false
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

        await queryInterface.addIndex('system_issue_reports', ['user_id']);
        await queryInterface.addIndex('system_issue_reports', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('system_issue_reports');
    }
};
