'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('certificate_types', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            issuing_authority: {
                type: Sequelize.ENUM('CLASS', 'FLAG'),
                allowNull: false
            },
            validity_years: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
                defaultValue: 'ACTIVE',
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            }
        });

        await queryInterface.addIndex('certificate_types', ['name']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('certificate_types');
    }
};
