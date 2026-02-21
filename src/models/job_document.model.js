export default (sequelize, DataTypes) => {
    const JobDocument = sequelize.define('JobDocument', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        required_document_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        file_url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        uploaded_by: {
            type: DataTypes.UUID,
            allowNull: false
        }
    }, {
        tableName: 'job_documents',
        underscored: true,
        timestamps: true,
    });

    JobDocument.associate = (models) => {
        JobDocument.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        JobDocument.belongsTo(models.CertificateRequiredDocument, { foreignKey: 'required_document_id' });
        JobDocument.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'Uploader' });
    };

    return JobDocument;
};
