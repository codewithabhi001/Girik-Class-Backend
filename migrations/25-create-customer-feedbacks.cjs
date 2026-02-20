'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('customer_feedbacks', {
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
            client_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            timeliness: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            professionalism: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            documentation: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            submitted_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('customer_feedbacks', ['job_id']);
        await queryInterface.addIndex('customer_feedbacks', ['client_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('customer_feedbacks');
    }
};
