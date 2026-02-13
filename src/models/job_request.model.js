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
                'CREATED', 'GM_APPROVED', 'TM_PRE_APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'SURVEY_DONE',
                'TO_APPROVED', 'TM_FINAL', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'
            ),
            defaultValue: 'CREATED',
            get() {
                const raw = this.getDataValue('job_status');
                return (raw === null || raw === '') ? 'CREATED' : raw;
            },
        },
        gm_assigned_surveyor_id: DataTypes.UUID,
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
        JobRequest.belongsTo(models.User, { foreignKey: 'gm_assigned_surveyor_id', as: 'surveyor' });
        JobRequest.belongsTo(models.CertificateType, { foreignKey: 'certificate_type_id' });
        JobRequest.hasMany(models.JobStatusHistory, { foreignKey: 'job_id' });
        JobRequest.hasOne(models.SurveyReport, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.ActivityPlanning, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.NonConformity, { foreignKey: 'job_id' });
        JobRequest.hasMany(models.Payment, { foreignKey: 'job_id' });
    };

    return JobRequest;
};
