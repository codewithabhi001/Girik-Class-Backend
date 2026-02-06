export default (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        user_id: DataTypes.UUID,
        title: DataTypes.STRING,
        message: DataTypes.TEXT,
        type: { type: DataTypes.ENUM('INFO', 'WARNING', 'CRITICAL'), defaultValue: 'INFO' },
        is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'notifications',
        underscored: true,
        timestamps: false,
    });

    Notification.associate = (models) => {
        Notification.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return Notification;
};
