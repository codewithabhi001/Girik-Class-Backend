export default (sequelize, DataTypes) => {
    const CertificateType = sequelize.define('CertificateType', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        name: DataTypes.STRING,
        issuing_authority: DataTypes.ENUM('CLASS', 'FLAG'),
        validity_years: DataTypes.INTEGER,
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
        description: DataTypes.TEXT,
    }, {
        tableName: 'certificate_types',
        underscored: true,
        timestamps: false,
    });

    return CertificateType;
};
