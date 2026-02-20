export default (sequelize, DataTypes) => {
    const JobRequest = sequelize.define('JobRequest', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        vessel_id: DataTypes.UUID,
        requested_by_user_id: DataTypes.UUID,
        certificate_type_id: DataTypes.UUID,
        reason: DataTypes.TEXT,
        target_port: DataTypes.STRING,
        target_date: DataTypes.DATEONLY,
        job_status: {
            type: DataTypes.ENUM(
                'CREATED', 'APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED', 'IN_PROGRESS', 'SURVEY_DONE',
                'REVIEWED', 'FINALIZED', 'REWORK_REQUESTED', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'
            ),
            defaultValue: 'CREATED',
            get() {
                const raw = this.getDataValue('job_status');
                return (raw === null || raw === '') ? 'CREATED' : raw;
            },
        },
        assigned_surveyor_id: DataTypes.UUID,
        assigned_by_user_id: DataTypes.UUID,
        generated_certificate_id: DataTypes.UUID,
        approved_by_user_id: DataTypes.UUID,
        remarks: DataTypes.TEXT,
    }, {
        tableName: 'job_requests',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    JobRequest.associate = (models) => {
        JobRequest.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
        JobRequest.belongsTo(models.User, { foreignKey: 'requested_by_user_id', as: 'requester' });
        JobRequest.belongsTo(models.User, { foreignKey: 'assigned_surveyor_id', as: 'surveyor' });
        JobRequest.belongsTo(models.User, { foreignKey: 'assigned_by_user_id', as: 'assigned_by' });
        JobRequest.belongsTo(models.User, { foreignKey: 'approved_by_user_id', as: 'approver' });
        JobRequest.belongsTo(models.CertificateType, { foreignKey: 'certificate_type_id' });
        JobRequest.belongsTo(models.Certificate, { foreignKey: 'generated_certificate_id', as: 'Certificate' });
        JobRequest.hasMany(models.JobStatusHistory, { foreignKey: 'job_id' });
        JobRequest.hasOne(models.SurveyReport, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.ActivityPlanning, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.NonConformity, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.Payment, { foreignKey: 'job_id' });
    };

    return JobRequest;
};
