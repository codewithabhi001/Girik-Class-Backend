export default (sequelize, DataTypes) => {
    const ScheduledTask = sequelize.define('ScheduledTask', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        task_type: DataTypes.STRING,
        related_entity: DataTypes.STRING,
        related_id: DataTypes.UUID,
        scheduled_for: DataTypes.DATE,
        status: { type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'), defaultValue: 'PENDING' },
    }, {
        tableName: 'scheduled_tasks',
        underscored: true,
        timestamps: false,
    });

    return ScheduledTask;
};
