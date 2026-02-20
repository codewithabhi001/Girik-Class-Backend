export default (sequelize, DataTypes) => {
    const SurveyStatusHistory = sequelize.define('SurveyStatusHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        survey_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        previous_status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        new_status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        changed_by: {
            type: DataTypes.UUID,
            allowNull: false
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        submission_iteration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'survey_status_histories',
        underscored: true,
        timestamps: true,
        updatedAt: false
    });

    SurveyStatusHistory.associate = (models) => {
        SurveyStatusHistory.belongsTo(models.Survey, { foreignKey: 'survey_id' });
        SurveyStatusHistory.belongsTo(models.User, { foreignKey: 'changed_by', as: 'User' });
    };

    return SurveyStatusHistory;
};
