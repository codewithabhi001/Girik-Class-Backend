'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('audit_logs', {
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
            action: {
                type: Sequelize.STRING,
                allowNull: false
            },
            entity_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            entity_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true
            },
            old_values: {
                type: Sequelize.JSON,
                allowNull: true
            },
            new_values: {
                type: Sequelize.JSON,
                allowNull: true
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            user_agent: {
                type: Sequelize.STRING,
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

        await queryInterface.addIndex('audit_logs', ['user_id']);
        await queryInterface.addIndex('audit_logs', ['entity_name', 'entity_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('audit_logs');
    }
};
