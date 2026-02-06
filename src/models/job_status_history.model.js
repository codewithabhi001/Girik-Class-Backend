export default (sequelize, DataTypes) => {
    const JobStatusHistory = sequelize.define('JobStatusHistory', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: DataTypes.UUID,
        old_status: DataTypes.STRING, // Using STRING to avoid ENUM updates issues if statuses change
        new_status: DataTypes.STRING,
        changed_by: DataTypes.UUID,
        change_reason: DataTypes.TEXT,
        changed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'job_status_history',
        underscored: true,
        timestamps: false,
    });

    JobStatusHistory.associate = (models) => {
        JobStatusHistory.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        JobStatusHistory.belongsTo(models.User, { foreignKey: 'changed_by' });
    };

    return JobStatusHistory;
};
