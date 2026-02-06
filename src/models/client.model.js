export default (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        company_name: DataTypes.STRING,
        company_code: { type: DataTypes.STRING, unique: true },
        address: DataTypes.TEXT,
        country: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        contact_person_name: DataTypes.STRING,
        contact_person_email: DataTypes.STRING,
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    }, {
        tableName: 'clients',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    Client.associate = (models) => {
        Client.hasMany(models.User, { foreignKey: 'client_id' });
        Client.hasMany(models.Vessel, { foreignKey: 'client_id' });
    };

    return Client;
};
