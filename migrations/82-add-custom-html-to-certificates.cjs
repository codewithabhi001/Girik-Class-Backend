'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('certificates', 'custom_html', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
      comment: 'Custom HTML content after manual updates/compilation'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('certificates', 'custom_html');
  }
};
 