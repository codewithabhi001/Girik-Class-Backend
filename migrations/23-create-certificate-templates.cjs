'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('certificate_templates', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            certificate_type_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'certificate_types',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            template_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            template_content: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            variables: {
                type: Sequelize.JSON,
                defaultValue: [],
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
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

        await queryInterface.addIndex('certificate_templates', ['certificate_type_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('certificate_templates');
    }
};
