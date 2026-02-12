export default (sequelize, DataTypes) => {
    const SurveyorProfile = sequelize.define('SurveyorProfile', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        user_id: DataTypes.UUID,
        surveyor_application_id: { type: DataTypes.UUID, allowNull: true },
        license_number: DataTypes.STRING,
        authorized_ship_types: DataTypes.JSON,
        authorized_certificates: DataTypes.JSON,
        valid_from: DataTypes.DATEONLY,
        valid_to: DataTypes.DATEONLY,
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'), defaultValue: 'ACTIVE' },
        is_available: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
        tableName: 'surveyor_profiles',
        underscored: true,
        timestamps: false,
    });

    SurveyorProfile.associate = (models) => {
        SurveyorProfile.belongsTo(models.User, { foreignKey: 'user_id' });
        SurveyorProfile.belongsTo(models.SurveyorApplication, { foreignKey: 'surveyor_application_id', as: 'application' });
    };

    return SurveyorProfile;
};
