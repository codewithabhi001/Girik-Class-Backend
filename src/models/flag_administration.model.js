export default (sequelize, DataTypes) => {
    const FlagAdministration = sequelize.define('FlagAdministration', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        flag_name: { type: DataTypes.STRING, unique: true },
        country: DataTypes.STRING,
        authority_name: DataTypes.STRING,
        contact_email: DataTypes.STRING,
        authorization_scope: DataTypes.TEXT,
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    }, {
        tableName: 'flag_administrations',
        underscored: true,
        timestamps: false,
    });

    return FlagAdministration;
};
