'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('checklist_templates', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            code: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            certificate_type_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'certificate_types',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            sections: {
                type: Sequelize.JSON,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'DRAFT'),
                defaultValue: 'DRAFT',
                allowNull: false
            },
            metadata: {
                type: Sequelize.JSON,
                defaultValue: {},
                allowNull: true
            },
            created_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            updated_by: {
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

        await queryInterface.addIndex('checklist_templates', ['code']);
        await queryInterface.addIndex('checklist_templates', ['certificate_type_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('checklist_templates');
    }
};
