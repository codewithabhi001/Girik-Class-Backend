'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('survey_reports', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            job_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'job_requests',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            surveyor_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION'
            },
            survey_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            gps_latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            },
            gps_longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            },
            attendance_photo_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            survey_statement: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('survey_reports', ['job_id']);
        await queryInterface.addIndex('survey_reports', ['surveyor_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('survey_reports');
    }
};
