'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('documents', 'document_type', {
      type: Sequelize.STRING,
      allowNull: true
    });
    // Also adding description as the swagger hints at it
    await queryInterface.addColumn('documents', 'description', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('documents', 'document_type');
    await queryInterface.removeColumn('documents', 'description');
  }
};
