'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('activity_plannings', {
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
            question_code: {
                type: Sequelize.STRING,
                allowNull: false
            },
            question_text: {
                type: Sequelize.STRING,
                allowNull: true
            },
            answer: {
                type: Sequelize.ENUM('YES', 'NO', 'NA'),
                allowNull: true
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            file_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('activity_plannings', ['job_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('activity_plannings');
    }
};
