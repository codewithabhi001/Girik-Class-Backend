export default (sequelize, DataTypes) => {
    const ChangeRequest = sequelize.define('ChangeRequest', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        entity_type: DataTypes.STRING,
        entity_id: DataTypes.UUID,
        requested_by: DataTypes.UUID,
        approved_by: { type: DataTypes.UUID, allowNull: true },
        change_description: DataTypes.TEXT,
        old_value: DataTypes.JSON,
        new_value: DataTypes.JSON,
        status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
        priority: { type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'), defaultValue: 'MEDIUM' },
        approval_remarks: DataTypes.TEXT,
        approved_at: DataTypes.DATE,
    }, {
        tableName: 'change_requests',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    ChangeRequest.associate = (models) => {
        ChangeRequest.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requester' });
        ChangeRequest.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
    };

    return ChangeRequest;
};
