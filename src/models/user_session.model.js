
export default (sequelize, DataTypes) => {
    const UserSession = sequelize.define('UserSession', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        user_id: DataTypes.UUID,
        token_hash: { type: DataTypes.STRING, allowNull: false, comment: 'Hash of the refresh token' },
        device_fingerprint: DataTypes.STRING,
        ip_address: DataTypes.STRING,
        user_agent: DataTypes.TEXT,
        location: DataTypes.STRING,
        last_active_at: DataTypes.DATE,
        expires_at: DataTypes.DATE,
        is_revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
        revoked_at: DataTypes.DATE,
        revoked_reason: DataTypes.STRING,
    }, {
        tableName: 'user_sessions',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    UserSession.associate = (models) => {
        UserSession.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return UserSession;
};
