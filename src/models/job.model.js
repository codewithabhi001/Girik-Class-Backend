export default (sequelize, DataTypes) => {
    const Job = sequelize.define('Job', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        client_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        vessel_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        surveyor_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        job_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        job_status: {
            type: DataTypes.ENUM(
                'CREATED',
                'APPROVED',
                'ASSIGNED',
                'SURVEY_AUTHORIZED',
                'IN_PROGRESS',
                'SURVEY_DONE',
                'REVIEWED',
                'FINALIZED',
                'REWORK_REQUESTED',
                'PAYMENT_DONE',
                'CERTIFIED',
                'REJECTED'
            ),
            defaultValue: 'CREATED'
        },
        scheduled_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false
        }
    }, {
        tableName: 'jobs',
        underscored: true,
        timestamps: true
    });

    Job.associate = (models) => {
        Job.belongsTo(models.User, { foreignKey: 'client_id', as: 'Client' });
        Job.belongsTo(models.User, { foreignKey: 'surveyor_id', as: 'Surveyor' });
        Job.belongsTo(models.User, { foreignKey: 'created_by', as: 'Creator' });
        Job.belongsTo(models.Vessel, { foreignKey: 'vessel_id', as: 'Vessel' });
        Job.hasOne(models.Survey, { foreignKey: 'job_id' });
        Job.hasMany(models.JobStatusHistory, { foreignKey: 'job_id' });
    };

    return Job;
};
