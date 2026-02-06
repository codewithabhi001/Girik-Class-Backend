export default (sequelize, DataTypes) => {
    const GpsTracking = sequelize.define('GpsTracking', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        surveyor_id: DataTypes.UUID,
        vessel_id: DataTypes.UUID,
        latitude: DataTypes.DECIMAL(10, 8),
        longitude: DataTypes.DECIMAL(11, 8),
        timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'gps_tracking',
        underscored: true,
        timestamps: false,
    });

    GpsTracking.associate = (models) => {
        GpsTracking.belongsTo(models.User, { foreignKey: 'surveyor_id' });
        GpsTracking.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
    };

    return GpsTracking;
};
