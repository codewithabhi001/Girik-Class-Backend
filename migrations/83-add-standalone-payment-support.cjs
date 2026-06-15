'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Change job_id column on payments table to allow NULL using raw SQL
        await queryInterface.sequelize.query('ALTER TABLE `payments` MODIFY COLUMN `job_id` CHAR(36) BINARY NULL;');

        // 2. Add reason column to payments table
        await queryInterface.addColumn('payments', 'reason', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert reason column
        await queryInterface.removeColumn('payments', 'reason');

        // Revert job_id nullability using raw SQL
        await queryInterface.sequelize.query('ALTER TABLE `payments` MODIFY COLUMN `job_id` CHAR(36) BINARY NOT NULL;');
    }
};
