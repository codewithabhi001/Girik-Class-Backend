
export default (sequelize, DataTypes) => {
    const SlaRule = sequelize.define('SlaRule', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        service_type: { type: DataTypes.STRING, allowNull: false, comment: 'HULL_SURVEY, CERT_ISSUE' },
        priority: { type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'), defaultValue: 'MEDIUM' },
        response_time_hours: { type: DataTypes.INTEGER, defaultValue: 24 },
        resolution_time_hours: { type: DataTypes.INTEGER, defaultValue: 72 },
        escalation_policy: { type: DataTypes.JSON },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        tableName: 'sla_rules',
        underscored: true,
        timestamps: true,
    });

    return SlaRule;
};
