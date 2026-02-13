export default (sequelize, DataTypes) => {
    const Approval = sequelize.define('Approval', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        entity_type: DataTypes.STRING,
        entity_id: DataTypes.UUID,
        approved_by: DataTypes.UUID,
        role: DataTypes.STRING,
        status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
        remarks: DataTypes.TEXT,
        approved_at: DataTypes.DATE,
    }, {
        tableName: 'approvals',
        underscored: true,
        timestamps: false,
    });

    Approval.associate = (models) => {
        Approval.belongsTo(models.User, { foreignKey: 'approved_by' });
    };

    return Approval;
};
