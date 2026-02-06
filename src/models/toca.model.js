export default (sequelize, DataTypes) => {
    const Toca = sequelize.define('Toca', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        vessel_id: DataTypes.UUID,
        losing_class_society: DataTypes.STRING,
        gaining_class_society: DataTypes.STRING,
        request_date: DataTypes.DATEONLY,
        status: { type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'), defaultValue: 'PENDING' },
        documents_url: DataTypes.JSON,
        decision_date: DataTypes.DATEONLY,
    }, {
        tableName: 'tocas',
        underscored: true,
        timestamps: false,
    });

    Toca.associate = (models) => {
        Toca.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
    };

    return Toca;
};
