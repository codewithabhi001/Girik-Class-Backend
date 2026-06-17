export default (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        company_name: { type: DataTypes.STRING, allowNull: false },
        company_code: { type: DataTypes.STRING, allowNull: false }, // removed unique: true to fix ER_TOO_MANY_KEYS
        company_id_number: { type: DataTypes.STRING(20), allowNull: true, defaultValue: null }, // IMO Company Identification Number (7 digits, per MSC.195(80))
        address: DataTypes.TEXT,
        country: DataTypes.STRING,
        email: { type: DataTypes.STRING, allowNull: false },
        phone: DataTypes.STRING,
        contact_person_name: DataTypes.STRING,
        contact_person_email: DataTypes.STRING,
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    }, {
        tableName: 'clients',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        hooks: {
            beforeValidate: (client) => {
                const fieldsToTrim = [
                    'company_name',
                    'company_code',
                    'country',
                    'email',
                    'contact_person_name',
                    'contact_person_email'
                ];
                for (const field of fieldsToTrim) {
                    if (typeof client[field] === 'string') {
                        client[field] = client[field].trim();
                    }
                }
                const fieldsToLower = [
                    'email',
                    'contact_person_email'
                ];
                for (const field of fieldsToLower) {
                    if (typeof client[field] === 'string') {
                        client[field] = client[field].toLowerCase();
                    }
                }
            }
        }
    });

    Client.associate = (models) => {
        Client.hasMany(models.User, {
            foreignKey: {
                name: 'client_id',
                field: 'client_id'
            }
        });
        Client.hasMany(models.Vessel, {
            foreignKey: {
                name: 'client_id',
                field: 'client_id'
            },
            as: 'Vessels'
        });
    };

    return Client;
};
