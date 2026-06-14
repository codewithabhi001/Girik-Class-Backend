'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add template_content to certificate_templates
    await queryInterface.addColumn('certificate_templates', 'template_content', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Raw HTML content for template'
    });

    // 2. Modify template_file_url to be optional
    await queryInterface.changeColumn('certificate_templates', 'template_file_url', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'S3 key for .docx template (legacy)'
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Revert template_file_url to be non-nullable (only do this if no nulls are present in database)
    await queryInterface.changeColumn('certificate_templates', 'template_file_url', {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'S3 key for .docx template'
    });

    // 2. Remove template_content
    await queryInterface.removeColumn('certificate_templates', 'template_content');
  }
};
