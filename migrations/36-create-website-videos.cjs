'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('website_videos', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            section: {
                type: Sequelize.STRING,
                allowNull: false
            },
            title: {
                type: Sequelize.STRING,
                allowNull: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            video_url: {
                type: Sequelize.STRING,
                allowNull: false
            },
            thumbnail_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            uploaded_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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

        await queryInterface.addIndex('website_videos', ['section']);
        await queryInterface.addIndex('website_videos', ['uploaded_by']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('website_videos');
    }
};
