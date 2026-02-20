'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('certificate_history', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            certificate_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'certificates',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            status: {
                type: Sequelize.ENUM('VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED'),
                allowNull: false
            },
            changed_by_user_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            change_reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            changed_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false
            }
        });

        await queryInterface.addIndex('certificate_history', ['certificate_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('certificate_history');
    }
};
