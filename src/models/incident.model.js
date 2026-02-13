export default (sequelize, DataTypes) => {
    const Incident = sequelize.define('Incident', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        vessel_id: DataTypes.UUID,
        reported_by: DataTypes.UUID,
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        status: { type: DataTypes.ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'), defaultValue: 'OPEN' },
        remarks: DataTypes.TEXT,
    }, {
        tableName: 'incidents',
        underscored: true,
        timestamps: true,
    });

    Incident.associate = (models) => {
        Incident.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
        Incident.belongsTo(models.User, { foreignKey: 'reported_by' });
    };

    return Incident;
};
