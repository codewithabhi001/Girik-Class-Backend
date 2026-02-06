export default (sequelize, DataTypes) => {
    const ApprovalStep = sequelize.define('ApprovalStep', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        approval_id: DataTypes.UUID,
        step_number: DataTypes.INTEGER,
        role_required: DataTypes.STRING,
        approved_by: DataTypes.UUID,
        status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
        remarks: DataTypes.TEXT,
        action_at: DataTypes.DATE,
    }, {
        tableName: 'approval_steps',
        underscored: true,
        timestamps: false,
    });

    ApprovalStep.associate = (models) => {
        ApprovalStep.belongsTo(models.Approval, { foreignKey: 'approval_id' });
        ApprovalStep.belongsTo(models.User, { foreignKey: 'approved_by' });
    };

    return ApprovalStep;
};
