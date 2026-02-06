export default (sequelize, DataTypes) => {
    const CertificateHistory = sequelize.define('CertificateHistory', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        certificate_id: DataTypes.UUID,
        status: DataTypes.ENUM('VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED'),
        changed_by_user_id: DataTypes.UUID,
        change_reason: DataTypes.TEXT,
        changed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'certificate_history',
        underscored: true,
        timestamps: false,
    });

    CertificateHistory.associate = (models) => {
        CertificateHistory.belongsTo(models.Certificate, { foreignKey: 'certificate_id' });
        CertificateHistory.belongsTo(models.User, { foreignKey: 'changed_by_user_id' });
    };

    return CertificateHistory;
};
