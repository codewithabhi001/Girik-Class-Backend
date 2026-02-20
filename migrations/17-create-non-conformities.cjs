'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('non_conformities', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            job_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'job_requests',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            severity: {
                type: Sequelize.ENUM('MINOR', 'MAJOR', 'CRITICAL'),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('OPEN', 'CLOSED'),
                defaultValue: 'OPEN',
                allowNull: false
            },
            closure_remarks: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            closed_at: {
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        await queryInterface.addIndex('non_conformities', ['job_id']);
        await queryInterface.addIndex('non_conformities', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('non_conformities');
    }
};
