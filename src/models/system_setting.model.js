export default (sequelize, DataTypes) => {
    const SystemSetting = sequelize.define('SystemSetting', {
        key: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            allowNull: false
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'system_settings',
        underscored: true,
        timestamps: true
    });

    return SystemSetting;
};
