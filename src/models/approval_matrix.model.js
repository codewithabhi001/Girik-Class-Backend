
export default (sequelize, DataTypes) => {
    const ApprovalMatrix = sequelize.define('ApprovalMatrix', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        context: { type: DataTypes.STRING, allowNull: false, comment: 'e.g. CERTIFICATE_ISSUANCE, JOB_ASSIGNMENT' },
        criteria_json: { type: DataTypes.JSON, comment: 'Matching logic e.g. { vessel_type: "TANKER" }' },
        steps_json: { type: DataTypes.JSON, comment: 'Array of steps e.g. [{ role: "TO", order: 1 }, { role: "GM", order: 2 }]' },
        priority: { type: DataTypes.INTEGER, defaultValue: 0, comment: 'Higher priority overrides generic rules' },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        tableName: 'approval_matrix',
        underscored: true,
        timestamps: true,
    });

    return ApprovalMatrix;
};
