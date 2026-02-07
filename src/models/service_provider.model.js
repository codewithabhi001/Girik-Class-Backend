
export default (sequelize, DataTypes) => {
    const ServiceProvider = sequelize.define('ServiceProvider', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        company_name: { type: DataTypes.STRING, allowNull: false },
        service_type: {
            type: DataTypes.ENUM('DRY_DOCK', 'LAB', 'LOGISTICS', 'CRANE', 'OTHER'),
            allowNull: false
        },
        contact_person: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        status: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'BLACKLISTED'),
            defaultValue: 'PENDING'
        },
        rating: { type: DataTypes.FLOAT, defaultValue: 0 },

    }, {
        tableName: 'service_providers',
        underscored: true,
        timestamps: true,
        paranoid: true
    });

    ServiceProvider.associate = (models) => {
        ServiceProvider.hasMany(models.ProviderEvaluation, { foreignKey: 'provider_id' });
    };

    return ServiceProvider;
};
