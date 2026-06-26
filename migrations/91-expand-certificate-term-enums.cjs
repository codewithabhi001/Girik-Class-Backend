'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Expand ENUM on job_certificates.certificate_term
        await queryInterface.changeColumn('job_certificates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL'),
            defaultValue: 'FULL_TERM',
        });

        // 2. Expand ENUM on certificate_templates.certificate_term
        await queryInterface.changeColumn('certificate_templates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL'),
            allowNull: true,
        });

        // 3. Expand ENUM on certificate_required_documents.applies_to_term
        await queryInterface.changeColumn('certificate_required_documents', 'applies_to_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL', 'BOTH', 'ALL'),
            defaultValue: 'FULL_TERM',
        });

        // 4. Add new survey requirement columns to certificate_types
        await queryInterface.addColumn('certificate_types', 'requires_survey_interim', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn('certificate_types', 'requires_survey_conditional', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn('certificate_types', 'requires_survey_provisional', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert ENUM on job_certificates.certificate_term
        await queryInterface.changeColumn('job_certificates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM'),
            defaultValue: 'FULL_TERM',
        });

        // Revert ENUM on certificate_templates.certificate_term
        await queryInterface.changeColumn('certificate_templates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM'),
            allowNull: true,
        });

        // Revert ENUM on certificate_required_documents.applies_to_term
        await queryInterface.changeColumn('certificate_required_documents', 'applies_to_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM', 'BOTH'),
            defaultValue: 'FULL_TERM',
        });

        // Remove added columns
        await queryInterface.removeColumn('certificate_types', 'requires_survey_interim');
        await queryInterface.removeColumn('certificate_types', 'requires_survey_conditional');
        await queryInterface.removeColumn('certificate_types', 'requires_survey_provisional');
    }
};
