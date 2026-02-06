export default (sequelize, DataTypes) => {
    const SystemSetting = sequelize.define('SystemSetting', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        setting_key: { type: DataTypes.STRING, unique: true },
        setting_value: DataTypes.TEXT,
        updated_by: DataTypes.UUID,
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'system_settings',
        underscored: true,
        timestamps: false,
    });

    SystemSetting.associate = (models) => {
        SystemSetting.belongsTo(models.User, { foreignKey: 'updated_by' });
    };

    return SystemSetting;
};
