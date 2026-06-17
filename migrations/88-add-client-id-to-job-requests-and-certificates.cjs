'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Make vessel_id nullable on job_requests
    await queryInterface.changeColumn('job_requests', 'vessel_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // 2. Add client_id column to job_requests table
    await queryInterface.addColumn('job_requests', 'client_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'vessel_id',
    });

    // 3. Add client_id column to certificates table
    await queryInterface.addColumn('certificates', 'client_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'vessel_id',
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove client_id from certificates table
    await queryInterface.removeColumn('certificates', 'client_id');

    // 2. Remove client_id from job_requests table
    await queryInterface.removeColumn('job_requests', 'client_id');

    // 3. Revert vessel_id to NOT nullable on job_requests (Warning: only if no nulls are present)
    await queryInterface.changeColumn('job_requests', 'vessel_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },
};
