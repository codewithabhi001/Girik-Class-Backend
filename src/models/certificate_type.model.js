export default (sequelize, DataTypes) => {
    const CertificateType = sequelize.define('CertificateType', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        name: DataTypes.STRING,
        short_code: DataTypes.STRING, // e.g., SC, LL, TM
        issuing_authority: DataTypes.ENUM('CLASS', 'FLAG'),
        validity_years: DataTypes.INTEGER,
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
        description: DataTypes.TEXT,
        requires_survey: { type: DataTypes.BOOLEAN, defaultValue: true },
        requires_survey_short_term: { type: DataTypes.BOOLEAN, defaultValue: false },
        requires_survey_full_term: { type: DataTypes.BOOLEAN, defaultValue: true },
        requires_survey_interim: { type: DataTypes.BOOLEAN, defaultValue: false },
        requires_survey_conditional: { type: DataTypes.BOOLEAN, defaultValue: false },
        requires_survey_provisional: { type: DataTypes.BOOLEAN, defaultValue: false },
        signature_url: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Default signature S3 URL override for this certificate type'
        },
    }, {
        tableName: 'certificate_types',
        underscored: true,
        timestamps: false,
    });

    CertificateType.associate = (models) => {
        CertificateType.hasMany(models.CertificateRequiredDocument, { foreignKey: 'certificate_type_id' });
        CertificateType.hasMany(models.CertificateTemplate, { as: 'Templates', foreignKey: 'certificate_type_id' });
    };

    return CertificateType;
};
