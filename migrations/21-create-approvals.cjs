'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('approvals', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            entity_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            entity_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false
            },
            approved_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            role: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
                defaultValue: 'PENDING',
                allowNull: false
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        await queryInterface.addIndex('approvals', ['entity_type', 'entity_id']);
        await queryInterface.addIndex('approvals', ['approved_by']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('approvals');
    }
};
