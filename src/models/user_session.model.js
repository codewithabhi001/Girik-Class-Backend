export default (sequelize, DataTypes) => {
    const UserSession = sequelize.define('UserSession', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        token_jti: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        device_info: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        last_activity_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'user_sessions',
        underscored: true,
        timestamps: true,
    });

    UserSession.associate = (models) => {
        UserSession.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return UserSession;
};
