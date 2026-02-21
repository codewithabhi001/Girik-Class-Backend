export default (sequelize, DataTypes) => {
    const VesselDocument = sequelize.define('VesselDocument', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        vessel_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        document_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        uploaded_by: {
            type: DataTypes.UUID,
            allowNull: false
        }
    }, {
        tableName: 'vessel_documents',
        underscored: true,
        timestamps: true,
    });

    VesselDocument.associate = (models) => {
        VesselDocument.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
        VesselDocument.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'Uploader' });
    };

    return VesselDocument;
};
