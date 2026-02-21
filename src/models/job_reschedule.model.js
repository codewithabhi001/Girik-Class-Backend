export default (sequelize, DataTypes) => {
    const JobReschedule = sequelize.define('JobReschedule', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        old_target_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        new_target_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        old_target_port: {
            type: DataTypes.STRING,
            allowNull: true
        },
        new_target_port: {
            type: DataTypes.STRING,
            allowNull: false
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        requested_by: {
            type: DataTypes.UUID,
            allowNull: false
        }
    }, {
        tableName: 'job_reschedules',
        underscored: true,
        timestamps: true,
    });

    JobReschedule.associate = (models) => {
        JobReschedule.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        JobReschedule.belongsTo(models.User, { foreignKey: 'requested_by', as: 'Requester' });
    };

    return JobReschedule;
};
