export default (sequelize, DataTypes) => {
    const Vessel = sequelize.define('Vessel', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        client_id: DataTypes.UUID,
        flag_administration_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'flag_administrations',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        },
        vessel_name: DataTypes.STRING,
        imo_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: /^[0-9]{7}$/
            }
        },
        call_sign: DataTypes.STRING,
        mmsi_number: {
            type: DataTypes.STRING,
            validate: {
                is: /^[0-9]{9}$/
            }
        },
        port_of_registry: DataTypes.STRING,
        year_built: DataTypes.INTEGER,
        ship_type: DataTypes.STRING,
        gross_tonnage: DataTypes.DECIMAL(12, 2),
        net_tonnage: DataTypes.DECIMAL(12, 2),
        deadweight: DataTypes.DECIMAL(12, 2),
        class_status: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'WITHDRAWN'),
        current_class_society: DataTypes.STRING,
        engine_type: DataTypes.STRING,
        builder_name: DataTypes.STRING,
    }, {
        tableName: 'vessels',
        underscored: true,
        timestamps: true,
    });

    Vessel.associate = (models) => {
        Vessel.belongsTo(models.Client, {
            foreignKey: {
                name: 'client_id',
                field: 'client_id'
            },
            as: 'Client'
        });
        Vessel.belongsTo(models.FlagAdministration, {
            foreignKey: 'flag_administration_id',
            as: 'FlagAdministration'
        });
        Vessel.hasMany(models.JobRequest, { foreignKey: 'vessel_id' });
        Vessel.hasMany(models.Certificate, { foreignKey: 'vessel_id' });
        Vessel.hasMany(models.VesselDocument, { foreignKey: 'vessel_id', as: 'Documents' });
        Vessel.hasMany(models.GpsTracking, { foreignKey: 'vessel_id' });
    };

    return Vessel;
};
