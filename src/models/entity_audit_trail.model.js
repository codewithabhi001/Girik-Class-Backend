export default (sequelize, DataTypes) => {
    const EntityAuditTrail = sequelize.define('EntityAuditTrail', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        entity_type: DataTypes.STRING,
        entity_id: DataTypes.UUID,
        action: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'),
        old_value: DataTypes.JSON,
        new_value: DataTypes.JSON,
        changed_by: DataTypes.UUID,
        changed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'entity_audit_trail',
        underscored: true,
        timestamps: false,
    });

    EntityAuditTrail.associate = (models) => {
        EntityAuditTrail.belongsTo(models.User, { foreignKey: 'changed_by' });
    };

    return EntityAuditTrail;
};
