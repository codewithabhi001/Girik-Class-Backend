'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add requires_survey_short_term & requires_survey_full_term to certificate_types
        await queryInterface.addColumn('certificate_types', 'requires_survey_short_term', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        });
        await queryInterface.addColumn('certificate_types', 'requires_survey_full_term', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false
        });

        // 2. Add certificate_term to job_certificates
        await queryInterface.addColumn('job_certificates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM'),
            defaultValue: 'FULL_TERM',
            allowNull: false
        });

        // 3. Add applies_to_term to certificate_required_documents
        await queryInterface.addColumn('certificate_required_documents', 'applies_to_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM', 'BOTH'),
            defaultValue: 'FULL_TERM',
            allowNull: false
        });

        // 4. Sync existing certificate types' requires_survey_full_term with their requires_survey value
        await queryInterface.sequelize.query(`
            UPDATE certificate_types 
            SET requires_survey_full_term = requires_survey;
        `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('certificate_types', 'requires_survey_short_term');
        await queryInterface.removeColumn('certificate_types', 'requires_survey_full_term');
        await queryInterface.removeColumn('job_certificates', 'certificate_term');
        await queryInterface.removeColumn('certificate_required_documents', 'applies_to_term');
    }
};
