export default (sequelize, DataTypes) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        entity_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        entity_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        old_values: {
            type: DataTypes.JSON,
            allowNull: true
        },
        new_values: {
            type: DataTypes.JSON,
            allowNull: true
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        user_agent: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'audit_logs',
        underscored: true,
        timestamps: true
    });

    AuditLog.associate = (models) => {
        AuditLog.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return AuditLog;
};
