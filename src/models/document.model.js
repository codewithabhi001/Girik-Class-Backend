export default (sequelize, DataTypes) => {
    const Document = sequelize.define('Document', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        entity_type: DataTypes.STRING,
        entity_id: DataTypes.UUID,
        file_url: DataTypes.STRING,
        file_type: DataTypes.STRING,
        uploaded_by: DataTypes.UUID,
        uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'documents',
        underscored: true,
        timestamps: false,
    });

    Document.associate = (models) => {
        Document.belongsTo(models.User, { foreignKey: 'uploaded_by' });
    };

    return Document;
};
