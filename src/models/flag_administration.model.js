export default (sequelize, DataTypes) => {
    const FlagAdministration = sequelize.define('FlagAdministration', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        flag_state_name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        country: DataTypes.STRING,
        authority_name: DataTypes.STRING,
        contact_email: {
            type: DataTypes.STRING,
            validate: {
                isEmail: true
            }
        },
        authorization_scope: DataTypes.TEXT,
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    }, {
        tableName: 'flag_administrations',
        underscored: true,
        timestamps: true,
        indexes: [
            { fields: ['status'] }
        ]
    });

    FlagAdministration.associate = (models) => {
        FlagAdministration.hasMany(models.Vessel, {
            foreignKey: 'flag_administration_id',
            as: 'Vessels'
        });
    };

    return FlagAdministration;
};
