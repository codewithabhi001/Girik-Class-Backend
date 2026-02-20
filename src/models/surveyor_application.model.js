export default (sequelize, DataTypes) => {
    const SurveyorApplication = sequelize.define('SurveyorApplication', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        full_name: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        nationality: DataTypes.STRING,
        qualification: DataTypes.STRING,
        years_of_experience: DataTypes.INTEGER,
        cv_file_url: DataTypes.STRING,
        certificate_files_url: DataTypes.JSON,
        id_proof_url: DataTypes.STRING,
        status: { type: DataTypes.ENUM('PENDING', 'DOCUMENTS_REQUIRED', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
        reviewer_remarks: DataTypes.TEXT,
        approved_user_id: { type: DataTypes.UUID, allowNull: true },
    }, {
        tableName: 'surveyor_applications',
        underscored: true,
        timestamps: false,
    });

    SurveyorApplication.associate = (models) => {
        SurveyorApplication.belongsTo(models.User, { foreignKey: 'approved_user_id', as: 'approvedUser' });
    };

    return SurveyorApplication;
};
