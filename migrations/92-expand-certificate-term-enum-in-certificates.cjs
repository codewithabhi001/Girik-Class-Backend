'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Expand ENUM on certificates.certificate_term
        await queryInterface.changeColumn('certificates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL'),
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert ENUM on certificates.certificate_term
        await queryInterface.changeColumn('certificates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM'),
            allowNull: true,
            defaultValue: null,
        });
    }
};
