'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add company_id_number (IMO Company Identification Number) — nullable so existing records aren't broken
    await queryInterface.addColumn('clients', 'company_id_number', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null,
      comment: 'IMO Company Identification Number (7 digits, mandatory on DOC certificate per MSC.195(80))',
      after: 'company_code',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('clients', 'company_id_number');
  },
};
