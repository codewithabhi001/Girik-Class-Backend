export default (sequelize, DataTypes) => {
    const DocumentVersion = sequelize.define('DocumentVersion', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        document_id: DataTypes.UUID,
        version_no: DataTypes.INTEGER,
        file_url: DataTypes.STRING,
        uploaded_by: DataTypes.UUID,
        uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'document_versions',
        underscored: true,
        timestamps: false,
    });

    DocumentVersion.associate = (models) => {
        DocumentVersion.belongsTo(models.Document, { foreignKey: 'document_id' });
        DocumentVersion.belongsTo(models.User, { foreignKey: 'uploaded_by' });
    };

    return DocumentVersion;
};
