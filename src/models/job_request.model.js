import { generateUniqueRandomId } from '../utils/idGenerator.util.js';

export default (sequelize, DataTypes) => {
    const JobRequest = sequelize.define('JobRequest', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_request_number: { 
            type: DataTypes.STRING, 
            unique: true,
            comment: 'Formatted random ID: GRJ-XXXXXXXX'
        },
        vessel_id: { type: DataTypes.UUID, allowNull: true },
        client_id: { type: DataTypes.UUID, allowNull: true },
        requested_by_user_id: { type: DataTypes.UUID, allowNull: false },
        reason: { type: DataTypes.TEXT, allowNull: true, defaultValue: 'Certificate inspection requested' },
        target_port: { type: DataTypes.STRING, allowNull: false },
        target_date: { type: DataTypes.DATEONLY, allowNull: false },
        job_status: {
            type: DataTypes.ENUM(
                'CREATED', 'DOCUMENT_VERIFIED', 'APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED', 'IN_PROGRESS', 'SURVEY_DONE',
                'REVIEWED', 'FINALIZED', 'REWORK_REQUESTED', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'
            ),
            defaultValue: 'CREATED',
            get() {
                const raw = this.getDataValue('job_status');
                return (raw === null || raw === '') ? 'CREATED' : raw;
            },
        },
        pending_action: {
            type: DataTypes.VIRTUAL,
            get() {
                const status = this.getDataValue('job_status');
                const isSurveyReq = this.getDataValue('is_survey_required') !== false;
                const certs = this.certificates || [];

                if (status === 'CREATED') {
                    return {
                        role: 'TO',
                        fallbackRoles: ['ADMIN', 'TM'],
                        message: 'Waiting for Technical Officer (TO), Technical Manager (TM) or Admin to verify documents'
                    };
                }

                if (status === 'REJECTED' || status === 'CERTIFIED') {
                    return null;
                }

                if (certs.length === 0) {
                    return {
                        role: 'TO',
                        fallbackRoles: ['ADMIN', 'TM'],
                        message: 'Waiting for Technical Officer (TO), Technical Manager (TM) or Admin to verify documents'
                    };
                }

                // If the job is already finalized, skip intermediate steps and check for certificate generation
                if (status === 'FINALIZED' || status === 'PAYMENT_DONE') {
                    const hasPendingDraft = certs.some(c => !c.generated_certificate_id);
                    if (hasPendingDraft) {
                        return {
                            role: 'TM',
                            fallbackRoles: ['GM', 'ADMIN'],
                            message: 'Waiting for Technical Manager (TM), General Manager (GM) or Admin to Generate Draft Certificate'
                        };
                    }
                    const hasPendingIssue = certs.some(c => c.status !== 'ISSUED' && c.status !== 'REJECTED');
                    if (hasPendingIssue) {
                        return {
                            role: 'GM',
                            fallbackRoles: ['ADMIN'],
                            message: 'Waiting for General Manager (GM) or Admin to Issue Certificate'
                        };
                    }
                    return null;
                }

                const hasPending = certs.some(c => c.status === 'PENDING');
                if (hasPending) {
                    return {
                        role: 'TO',
                        fallbackRoles: ['ADMIN', 'TM'],
                        message: 'Waiting for Technical Officer (TO), Technical Manager (TM) or Admin to verify documents (Certificates pending)'
                    };
                }

                if (!isSurveyReq && status === 'APPROVED') {
                    return {
                        role: 'TM',
                        fallbackRoles: ['ADMIN'],
                        message: 'Waiting for Technical Manager (TM) or Admin to Finalize Job'
                    };
                }

                const unassignedDocVerified = certs.some(c => c.status === 'DOCUMENT_VERIFIED' && !c.assigned_surveyor_id);
                if (unassignedDocVerified && ['CREATED', 'DOCUMENT_VERIFIED', 'APPROVED'].includes(status)) {
                    return {
                        role: 'GM',
                        fallbackRoles: ['ADMIN'],
                        message: isSurveyReq ? 'Waiting for General Manager (GM) or Admin to Approve Job / Assign Surveyor' : 'Waiting for General Manager (GM) or Admin to Approve Job'
                    };
                }

                const assignedDocVerified = certs.some(c => c.status === 'DOCUMENT_VERIFIED' && c.assigned_surveyor_id);
                if (assignedDocVerified && ['APPROVED', 'ASSIGNED'].includes(status)) {
                    return {
                        role: 'TM',
                        fallbackRoles: ['ADMIN'],
                        message: 'Waiting for Technical Manager (TM) or Admin to Authorize Survey'
                    };
                }

                const hasRework = certs.some(c => c.status === 'REWORK_REQUESTED');
                if (hasRework) {
                    return {
                        role: 'SURVEYOR',
                        fallbackRoles: [],
                        message: 'Waiting for Surveyor to Submit Corrected Survey'
                    };
                }

                const hasSurveyAuth = certs.some(c => c.status === 'SURVEY_AUTHORIZED');
                if (hasSurveyAuth) {
                    return {
                        role: 'SURVEYOR',
                        fallbackRoles: [],
                        message: 'Waiting for Surveyor to Complete Survey'
                    };
                }

                const hasSurveyDone = certs.some(c => c.status === 'SURVEY_DONE');
                if (hasSurveyDone) {
                    if (status === 'REVIEWED') {
                        let allIssued = true;
                        let hasSurveys = false;
                        for (const c of certs) {
                            if (c.survey) {
                                hasSurveys = true;
                                if (c.survey.survey_statement_status !== 'ISSUED') {
                                    allIssued = false;
                                }
                            }
                        }

                        if (hasSurveys && !allIssued) {
                            return {
                                role: 'TM',
                                fallbackRoles: ['ADMIN'],
                                message: 'Waiting for Technical Manager (TM) or Admin to Draft and Issue Survey Statement'
                            };
                        }

                        return {
                            role: 'TM',
                            fallbackRoles: ['ADMIN'],
                            message: 'Waiting for Technical Manager (TM) or Admin to Finalize Job'
                        };
                    }
                    return {
                        role: 'TECH_TEAM',
                        fallbackRoles: ['TM', 'TO', 'ADMIN'],
                        message: 'Waiting for Technical Manager (TM), Technical Officer (TO) or Admin to Review Survey'
                    };
                }

                const hasPendingDraft = certs.some(c => !c.generated_certificate_id && c.status !== 'REJECTED');
                if (hasPendingDraft) {
                    return {
                        role: 'TM',
                        fallbackRoles: ['GM', 'ADMIN'],
                        message: 'Waiting for Technical Manager (TM), General Manager (GM) or Admin to Generate Draft Certificate'
                    };
                }

                const hasPendingIssue = certs.some(c => c.status !== 'ISSUED' && c.status !== 'REJECTED');
                if (hasPendingIssue) {
                    return {
                        role: 'GM',
                        fallbackRoles: ['ADMIN'],
                        message: 'Waiting for General Manager (GM) or Admin to Issue Certificate'
                    };
                }

                return null;
            }
        },
        assigned_surveyor_id: DataTypes.UUID,
        assigned_by_user_id: DataTypes.UUID,
        approved_by_user_id: DataTypes.UUID,
        remarks: DataTypes.TEXT,
        is_survey_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        reschedule_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        priority: {
            type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
            defaultValue: 'NORMAL',
            allowNull: false,
            comment: 'Job priority set via PUT /:id/priority by ADMIN/GM/TM/TO'
        },
        source_activity_request_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Set when job is created via activity request conversion',
        },
    }, {
        tableName: 'job_requests',
        underscored: true,
        timestamps: true,
        updatedAt: true,
        hooks: {
            beforeCreate: async (job) => {
                if (!job.job_request_number) {
                    job.job_request_number = await generateUniqueRandomId('GRJ', JobRequest, 'job_request_number');
                }
            }
        }
    });


    JobRequest.associate = (models) => {
        JobRequest.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
        JobRequest.belongsTo(models.Client, { foreignKey: 'client_id', as: 'Client' });
        JobRequest.belongsTo(models.User, { foreignKey: 'requested_by_user_id', as: 'requester' });
        JobRequest.belongsTo(models.User, { foreignKey: 'assigned_surveyor_id', as: 'surveyor' });
        JobRequest.belongsTo(models.User, { foreignKey: 'assigned_by_user_id', as: 'assigned_by' });
        JobRequest.belongsTo(models.User, { foreignKey: 'approved_by_user_id', as: 'approver' });
        JobRequest.hasMany(models.JobStatusHistory, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.JobCertificate, { foreignKey: 'job_request_id', as: 'certificates' });

        JobRequest.hasMany(models.ActivityPlanning, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.NonConformity, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.Payment, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.JobDocument, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.JobReschedule, { foreignKey: 'job_id' });
        JobRequest.belongsTo(models.ActivityRequest, {
            foreignKey: 'source_activity_request_id',
            as: 'SourceActivityRequest',
        });
    };

    return JobRequest;
};
