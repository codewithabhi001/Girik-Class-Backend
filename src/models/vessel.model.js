export default (sequelize, DataTypes) => {
    const Vessel = sequelize.define('Vessel', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        client_id: DataTypes.UUID,
        vessel_name: DataTypes.STRING,
        imo_number: DataTypes.STRING, // removed unique to fix DB sync errors
        call_sign: DataTypes.STRING,
        mmsi_number: DataTypes.STRING,
        flag_state: DataTypes.STRING,
        port_of_registry: DataTypes.STRING,
        year_built: DataTypes.INTEGER,
        ship_type: DataTypes.STRING,
        gross_tonnage: DataTypes.FLOAT,
        net_tonnage: DataTypes.FLOAT,
        deadweight: DataTypes.FLOAT,
        class_status: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'WITHDRAWN'),
        current_class_society: DataTypes.STRING,
        engine_type: DataTypes.STRING,
        builder_name: DataTypes.STRING,
    }, {
        tableName: 'vessels',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    Vessel.associate = (models) => {
        Vessel.belongsTo(models.Client, {
            foreignKey: {
                name: 'client_id',
                field: 'client_id' // Explicitly map to snake_case column
            },
            as: 'Client'
        });
        Vessel.hasMany(models.JobRequest, { foreignKey: 'vessel_id' });
        Vessel.hasMany(models.Certificate, { foreignKey: 'vessel_id' });
        Vessel.hasMany(models.GpsTracking, { foreignKey: 'vessel_id' });
    };

    return Vessel;
};
