'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('certificate_templates', 'template_file_url');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('certificate_templates', 'template_file_url', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'S3 key for .docx template (legacy)'
    });
  }
};
