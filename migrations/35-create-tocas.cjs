'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tocas', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            vessel_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'vessels',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            losing_class_society: {
                type: Sequelize.STRING,
                allowNull: true
            },
            gaining_class_society: {
                type: Sequelize.STRING,
                allowNull: true
            },
            request_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
                defaultValue: 'PENDING',
                allowNull: false
            },
            documents_url: {
                type: Sequelize.JSON,
                allowNull: true
            },
            decision_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            }
        });

        await queryInterface.addIndex('tocas', ['vessel_id']);
        await queryInterface.addIndex('tocas', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tocas');
    }
};
