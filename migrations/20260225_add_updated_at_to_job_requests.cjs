'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if updated_at already exists (safety)
        const table = await queryInterface.describeTable('job_requests');
        if (!table.updated_at) {
            await queryInterface.addColumn('job_requests', 'updated_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('job_requests', 'updated_at');
    }
};
