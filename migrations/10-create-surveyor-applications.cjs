'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('surveyor_applications', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            full_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: true
            },
            nationality: {
                type: Sequelize.STRING,
                allowNull: true
            },
            qualification: {
                type: Sequelize.STRING,
                allowNull: true
            },
            years_of_experience: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            cv_file_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            certificate_files_url: {
                type: Sequelize.JSON,
                allowNull: true
            },
            id_proof_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'DOCUMENTS_REQUIRED', 'APPROVED', 'REJECTED'),
                defaultValue: 'PENDING',
                allowNull: false
            },
            reviewer_remarks: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            approved_user_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }
        });

        await queryInterface.addIndex('surveyor_applications', ['email']);
        await queryInterface.addIndex('surveyor_applications', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('surveyor_applications');
    }
};
