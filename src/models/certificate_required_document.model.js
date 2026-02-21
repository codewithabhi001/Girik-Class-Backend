export default (sequelize, DataTypes) => {
    const CertificateRequiredDocument = sequelize.define('CertificateRequiredDocument', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        certificate_type_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        document_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        is_mandatory: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'certificate_required_documents',
        underscored: true,
        timestamps: true,
    });

    CertificateRequiredDocument.associate = (models) => {
        CertificateRequiredDocument.belongsTo(models.CertificateType, { foreignKey: 'certificate_type_id' });
        CertificateRequiredDocument.hasMany(models.JobDocument, { foreignKey: 'required_document_id' });
    };

    return CertificateRequiredDocument;
};
