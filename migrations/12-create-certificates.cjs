'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('certificates', {
            id: {
                type: Sequelize.CHAR(36).BINARY,
                primaryKey: true,
                allowNull: false
            },
            vessel_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'vessels',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            certificate_type_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'certificate_types',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION'
            },
            certificate_number: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            issue_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            expiry_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED'),
                defaultValue: 'VALID',
                allowNull: false
            },
            qr_code_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            pdf_file_url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            issued_by_user_id: {
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

        await queryInterface.addIndex('certificates', ['certificate_number']);
        await queryInterface.addIndex('certificates', ['vessel_id']);
        await queryInterface.addIndex('certificates', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('certificates');
    }
};
