export default (sequelize, DataTypes) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        user_id: DataTypes.UUID,
        action: DataTypes.STRING,
        entity_name: DataTypes.STRING,
        entity_id: DataTypes.STRING,
        ip_address: DataTypes.STRING,
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'audit_logs',
        underscored: true,
        timestamps: false,
    });

    AuditLog.associate = (models) => {
        AuditLog.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return AuditLog;
};
