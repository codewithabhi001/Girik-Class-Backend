'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('surveys', 'survey_statement_status', {
            type: Sequelize.ENUM('NOT_PREPARED', 'DRAFTED', 'ISSUED'),
            defaultValue: 'NOT_PREPARED',
            allowNull: false
        });

        await queryInterface.addColumn('surveys', 'survey_statement_pdf_url', {
            type: Sequelize.STRING,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('surveys', 'survey_statement_status');
        await queryInterface.removeColumn('surveys', 'survey_statement_pdf_url');
        // Note: removing an ENUM in Postgres can be tricky if shared, but here it's specific.
    }
};
