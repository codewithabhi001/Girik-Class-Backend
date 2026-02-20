'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('job_requests', 'generated_certificate_id', {
            type: Sequelize.CHAR(36).BINARY,
            allowNull: true,
            references: {
                model: 'certificates',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('job_requests', 'generated_certificate_id', {
            type: Sequelize.CHAR(36).BINARY,
            allowNull: true
        });
    }
};
