'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('surveyor_profiles', {
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
            surveyor_application_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'surveyor_applications',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            license_number: {
                type: Sequelize.STRING,
                allowNull: true
            },
            authorized_ship_types: {
                type: Sequelize.JSON,
                allowNull: true
            },
            authorized_certificates: {
                type: Sequelize.JSON,
                allowNull: true
            },
            valid_from: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            valid_to: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
                defaultValue: 'ACTIVE',
                allowNull: false
            },
            is_available: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
            }
        });

        await queryInterface.addIndex('surveyor_profiles', ['user_id']);
        await queryInterface.addIndex('surveyor_profiles', ['license_number']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('surveyor_profiles');
    }
};
