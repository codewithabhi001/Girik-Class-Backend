'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 1. ADD NEW COLUMNS
            await queryInterface.addColumn('surveys', 'declared_by', {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }, { transaction });

            await queryInterface.addColumn('surveys', 'declared_at', {
                type: Sequelize.DATE,
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('surveys', 'start_latitude', {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('surveys', 'start_longitude', {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('surveys', 'submit_latitude', {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('surveys', 'submit_longitude', {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('surveys', 'signature_url', {
                type: Sequelize.STRING(255),
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('surveys', 'declaration_hash', {
                type: Sequelize.STRING(64),
                allowNull: true
            }, { transaction });

            // 2. DROP AMBIGUOUS GPS FIELDS
            await queryInterface.removeColumn('surveys', 'gps_latitude', { transaction });
            await queryInterface.removeColumn('surveys', 'gps_longitude', { transaction });

            // 3. REMOVE DUPLICATE INDEX IF EXISTS
            // We use try-catch for index removal as it might fail if the index doesn't exist
            try {
                await queryInterface.removeIndex('surveys', 'surveys_job_id', { transaction });
            } catch (e) {
                console.warn('Index surveys_job_id not found, skipping removal.');
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.removeColumn('surveys', 'declared_by', { transaction });
            await queryInterface.removeColumn('surveys', 'declared_at', { transaction });
            await queryInterface.removeColumn('surveys', 'start_latitude', { transaction });
            await queryInterface.removeColumn('surveys', 'start_longitude', { transaction });
            await queryInterface.removeColumn('surveys', 'submit_latitude', { transaction });
            await queryInterface.removeColumn('surveys', 'submit_longitude', { transaction });
            await queryInterface.removeColumn('surveys', 'signature_url', { transaction });
            await queryInterface.removeColumn('surveys', 'declaration_hash', { transaction });

            await queryInterface.addColumn('surveys', 'gps_latitude', {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('surveys', 'gps_longitude', {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            }, { transaction });

            try {
                await queryInterface.addIndex('surveys', ['job_id'], {
                    name: 'surveys_job_id',
                    transaction
                });
            } catch (e) {
                // ignore
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
