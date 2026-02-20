'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('payments', {
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
            invoice_number: {
                type: Sequelize.STRING,
                allowNull: true
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING,
                defaultValue: 'USD',
                allowNull: false
            },
            payment_status: {
                type: Sequelize.ENUM('UNPAID', 'PAID', 'ON_HOLD'),
                defaultValue: 'UNPAID',
                allowNull: false
            },
            payment_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            receipt_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            verified_by_user_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        await queryInterface.addIndex('payments', ['job_id']);
        await queryInterface.addIndex('payments', ['invoice_number']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('payments');
    }
};
