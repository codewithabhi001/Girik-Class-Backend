'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Update certificate_types table
        await queryInterface.addColumn('certificate_types', 'requires_survey', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false
        });

        // 2. Create certificate_required_documents table
        await queryInterface.createTable('certificate_required_documents', {
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
            document_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            is_mandatory: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // 3. Create job_documents table
        await queryInterface.createTable('job_documents', {
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
            required_document_id: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'certificate_required_documents',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            file_url: {
                type: Sequelize.STRING,
                allowNull: false
            },
            uploaded_by: {
                type: Sequelize.CHAR(36).BINARY, // FK to users
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // 4. Update job_requests table
        await queryInterface.addColumn('job_requests', 'is_survey_required', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false
        });

        await queryInterface.addColumn('job_requests', 'reschedule_count', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });

        // 5. Update job_status enum in job_requests
        // For MySQL, we need to modify the column.
        // The new list: 'CREATED', 'DOCUMENT_VERIFIED', 'APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED', 'IN_PROGRESS', 'SURVEY_DONE', 'REVIEWED', 'FINALIZED', 'REWORK_REQUESTED', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'
        await queryInterface.changeColumn('job_requests', 'job_status', {
            type: Sequelize.ENUM(
                'CREATED', 'DOCUMENT_VERIFIED', 'APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED', 'IN_PROGRESS', 'SURVEY_DONE',
                'REVIEWED', 'FINALIZED', 'REWORK_REQUESTED', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'
            ),
            defaultValue: 'CREATED',
            allowNull: false
        });

        // 6. Create job_reschedules table
        await queryInterface.createTable('job_reschedules', {
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
            old_target_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            new_target_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            old_target_port: {
                type: Sequelize.STRING,
                allowNull: true
            },
            new_target_port: {
                type: Sequelize.STRING,
                allowNull: false
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            requested_by: {
                type: Sequelize.CHAR(36).BINARY,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('job_reschedules');
        await queryInterface.changeColumn('job_requests', 'job_status', {
            type: Sequelize.ENUM(
                'CREATED', 'APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED', 'IN_PROGRESS', 'SURVEY_DONE',
                'REVIEWED', 'FINALIZED', 'REWORK_REQUESTED', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'
            ),
            defaultValue: 'CREATED',
            allowNull: false
        });
        await queryInterface.removeColumn('job_requests', 'reschedule_count');
        await queryInterface.removeColumn('job_requests', 'is_survey_required');
        await queryInterface.dropTable('job_documents');
        await queryInterface.dropTable('certificate_required_documents');
        await queryInterface.removeColumn('certificate_types', 'requires_survey');
    }
};
