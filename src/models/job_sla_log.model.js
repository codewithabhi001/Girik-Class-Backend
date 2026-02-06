
export default (sequelize, DataTypes) => {
    const JobSlaLog = sequelize.define('JobSlaLog', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: DataTypes.UUID,
        action: { type: DataTypes.ENUM('START', 'PAUSE', 'RESUME', 'OVERRIDE', 'BREACH', 'COMPLETE'), allowNull: false },
        reason: DataTypes.TEXT,
        previous_deadline: DataTypes.DATE,
        new_deadline: DataTypes.DATE,
        performed_by: DataTypes.UUID,
    }, {
        tableName: 'job_sla_logs',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    JobSlaLog.associate = (models) => {
        JobSlaLog.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        JobSlaLog.belongsTo(models.User, { foreignKey: 'performed_by' });
    };

    return JobSlaLog;
};
