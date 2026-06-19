'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add signature_url to certificates table
    await queryInterface.addColumn('certificates', 'signature_url', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Custom signature S3 URL override for this specific certificate instance'
    });

    // 2. Add signature_url to certificate_types table
    await queryInterface.addColumn('certificate_types', 'signature_url', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Default signature S3 URL override for this certificate type'
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove signature_url from certificates table
    await queryInterface.removeColumn('certificates', 'signature_url');

    // 2. Remove signature_url from certificate_types table
    await queryInterface.removeColumn('certificate_types', 'signature_url');
  }
};
