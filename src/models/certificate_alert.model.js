export default (sequelize, DataTypes) => {
    const CertificateAlert = sequelize.define('CertificateAlert', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        certificate_id: DataTypes.UUID,
        alert_type: DataTypes.ENUM('EXPIRY_REMINDER', 'SUSPENSION', 'REVOCATION'),
        triggered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        sent_to_role: DataTypes.STRING,
    }, {
        tableName: 'certificate_alerts',
        underscored: true,
        timestamps: false,
    });

    CertificateAlert.associate = (models) => {
        CertificateAlert.belongsTo(models.Certificate, { foreignKey: 'certificate_id' });
    };

    return CertificateAlert;
};
