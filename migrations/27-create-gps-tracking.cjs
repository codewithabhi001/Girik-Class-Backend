'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('gps_tracking', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            surveyor_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
            job_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'job_requests',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: false
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: false
            },
            timestamp: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false
            }
        });

        await queryInterface.addIndex('gps_tracking', ['surveyor_id']);
        await queryInterface.addIndex('gps_tracking', ['job_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('gps_tracking');
    }
};
