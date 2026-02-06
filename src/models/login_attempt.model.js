export default (sequelize, DataTypes) => {
    const LoginAttempt = sequelize.define('LoginAttempt', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true,
        },
        user_id: DataTypes.UUID,
        ip_address: DataTypes.STRING,
        success: DataTypes.BOOLEAN,
        attempted_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'login_attempts',
        underscored: true,
        timestamps: false,
    });

    LoginAttempt.associate = (models) => {
        LoginAttempt.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return LoginAttempt;
};
