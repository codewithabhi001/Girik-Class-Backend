'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notification_preferences', {
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
            email_enabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            app_enabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            alert_types: {
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
            }
        });

        await queryInterface.addIndex('notification_preferences', ['user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('notification_preferences');
    }
};
