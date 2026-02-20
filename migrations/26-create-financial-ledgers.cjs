'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('financial_ledgers', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            invoice_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'payments',
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
            transaction_type: {
                type: Sequelize.ENUM('CHARGE', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'WRITEOFF'),
                allowNull: false
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(3),
                defaultValue: 'USD',
                allowNull: false
            },
            reference_id: {
                type: Sequelize.STRING,
                allowNull: true
            },
            performed_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            balance_after: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('financial_ledgers', ['job_id']);
        await queryInterface.addIndex('financial_ledgers', ['invoice_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('financial_ledgers');
    }
};
