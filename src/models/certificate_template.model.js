export default (sequelize, DataTypes) => {
    const CertificateTemplate = sequelize.define('CertificateTemplate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        certificate_type_id: DataTypes.UUID,
        template_name: DataTypes.STRING,
        template_content: DataTypes.TEXT,
        variables: { type: DataTypes.JSON, defaultValue: [] },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        tableName: 'certificate_templates',
        underscored: true,
        timestamps: true,
    });

    CertificateTemplate.associate = (models) => {
        CertificateTemplate.belongsTo(models.CertificateType, { foreignKey: 'certificate_type_id' });
    };

    return CertificateTemplate;
};
