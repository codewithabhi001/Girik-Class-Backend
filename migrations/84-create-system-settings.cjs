'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('system_settings', {
            key: {
                type: Sequelize.STRING(64),
                primaryKey: true,
                allowNull: false
            },
            value: {
                type: Sequelize.TEXT,
                allowNull: false
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('system_settings');
    }
};
