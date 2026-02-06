export default (sequelize, DataTypes) => {
    const NotificationPreference = sequelize.define('NotificationPreference', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        email_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        app_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        alert_types: {
            type: DataTypes.JSON, // Array of strings: ['EXPIRY', 'JOB_ASSIGNMENT', etc.]
            defaultValue: []
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'notification_preferences',
        timestamps: true,
        underscored: true
    });

    NotificationPreference.associate = (models) => {
        NotificationPreference.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
    };

    return NotificationPreference;
};
