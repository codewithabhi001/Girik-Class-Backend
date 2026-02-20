export default (sequelize, DataTypes) => {
    const JobStatusHistory = sequelize.define('JobStatusHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        job_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        previous_status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        new_status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        changed_by: {
            type: DataTypes.UUID,
            allowNull: false
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'job_status_histories',
        underscored: true,
        timestamps: true
    });

    JobStatusHistory.associate = (models) => {
        JobStatusHistory.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        JobStatusHistory.belongsTo(models.User, { foreignKey: 'changed_by' });
    };

    return JobStatusHistory;
};
