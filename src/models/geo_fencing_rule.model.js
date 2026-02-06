export default (sequelize, DataTypes) => {
    const GeoFencingRule = sequelize.define('GeoFencingRule', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        vessel_id: DataTypes.UUID,
        radius_meters: DataTypes.INTEGER,
        active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        tableName: 'geo_fencing_rules',
        underscored: true,
        timestamps: false,
    });

    GeoFencingRule.associate = (models) => {
        GeoFencingRule.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
    };

    return GeoFencingRule;
};
