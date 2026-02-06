export default (sequelize, DataTypes) => {
    const ApiRateLimit = sequelize.define('ApiRateLimit', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        ip_address: DataTypes.STRING,
        endpoint: DataTypes.STRING,
        request_count: DataTypes.INTEGER,
        last_request_at: DataTypes.DATE,
    }, {
        tableName: 'api_rate_limits',
        underscored: true,
        timestamps: false,
    });

    return ApiRateLimit;
};
