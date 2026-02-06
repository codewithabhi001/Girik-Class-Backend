
export default (sequelize, DataTypes) => {
    const LegalHold = sequelize.define('LegalHold', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        case_reference: { type: DataTypes.STRING, allowNull: false, comment: 'Court case or internal reference' },
        description: DataTypes.TEXT,
        reason: DataTypes.TEXT,
        initiated_by: DataTypes.UUID,
        status: { type: DataTypes.ENUM('ACTIVE', 'RELEASED'), defaultValue: 'ACTIVE' },
        start_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        end_date: DataTypes.DATE,
        scope: { type: DataTypes.JSON, comment: 'Target entities e.g. { vessel_id: "...", job_ids: [] }' }
    }, {
        tableName: 'legal_holds',
        underscored: true,
        timestamps: true,
    });

    LegalHold.associate = (models) => {
        LegalHold.belongsTo(models.User, { foreignKey: 'initiated_by', as: 'initiator' });
    };

    return LegalHold;
};
