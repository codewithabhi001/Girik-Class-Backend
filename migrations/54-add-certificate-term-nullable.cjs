'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('certificates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM'),
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert to NOT NULL with default FULL_TERM
        await queryInterface.changeColumn('certificates', 'certificate_term', {
            type: Sequelize.ENUM('FULL_TERM', 'SHORT_TERM'),
            allowNull: false,
            defaultValue: 'FULL_TERM',
        });
    }
};
