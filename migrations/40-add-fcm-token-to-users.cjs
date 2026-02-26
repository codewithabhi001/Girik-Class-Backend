'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'fcm_token', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'last_login_at'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'fcm_token');
    }
};
