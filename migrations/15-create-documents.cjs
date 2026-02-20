'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('documents', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            entity_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            entity_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false
            },
            file_url: {
                type: Sequelize.STRING,
                allowNull: false
            },
            file_type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            document_type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            description: {
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
            uploaded_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false
            }
        });

        await queryInterface.addIndex('documents', ['entity_type', 'entity_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('documents');
    }
};
