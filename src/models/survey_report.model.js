export default (sequelize, DataTypes) => {
    const SurveyReport = sequelize.define('SurveyReport', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: DataTypes.UUID,
        surveyor_id: DataTypes.UUID,
        survey_date: DataTypes.DATE,
        gps_latitude: DataTypes.DECIMAL(10, 8),
        gps_longitude: DataTypes.DECIMAL(11, 8),
        attendance_photo_url: DataTypes.STRING,
        survey_statement: DataTypes.TEXT,
    }, {
        tableName: 'survey_reports',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    SurveyReport.associate = (models) => {
        SurveyReport.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        SurveyReport.belongsTo(models.User, { foreignKey: 'surveyor_id' });
    };

    return SurveyReport;
};
