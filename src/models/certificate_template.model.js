export default (sequelize, DataTypes) => {
    const CertificateTemplate = sequelize.define('CertificateTemplate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        certificate_type_id: { type: DataTypes.UUID, allowNull: false },
        template_name: { type: DataTypes.STRING, allowNull: false },
        certificate_term: {
            type: DataTypes.ENUM('FULL_TERM', 'SHORT_TERM'),
            allowNull: true,
        },
        template_content: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Raw HTML content for template'
        },
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
