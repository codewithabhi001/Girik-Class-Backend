export default (sequelize, DataTypes) => {
    const Certificate = sequelize.define('Certificate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        vessel_id: DataTypes.UUID,
        certificate_type_id: DataTypes.UUID,
        certificate_number: { type: DataTypes.STRING, unique: true },
        issue_date: DataTypes.DATEONLY,
        expiry_date: DataTypes.DATEONLY,
        status: { type: DataTypes.ENUM('VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED'), defaultValue: 'VALID' },
        qr_code_url: DataTypes.STRING,
        pdf_file_url: DataTypes.STRING,
        issued_by_user_id: DataTypes.UUID,
    }, {
        tableName: 'certificates',
        underscored: true,
        timestamps: false,
    });

    Certificate.associate = (models) => {
        Certificate.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
        Certificate.belongsTo(models.CertificateType, { foreignKey: 'certificate_type_id' });
        Certificate.belongsTo(models.User, { foreignKey: 'issued_by_user_id', as: 'issuer' });
        Certificate.hasMany(models.CertificateHistory, { foreignKey: 'certificate_id' });
        Certificate.hasMany(models.CertificateAlert, { foreignKey: 'certificate_id' });
    };

    return Certificate;
};
