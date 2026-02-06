export default (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true,
        },
        role_name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: DataTypes.TEXT,
    }, {
        tableName: 'roles',
        underscored: true,
        timestamps: false,
    });

    Role.associate = (models) => {
        Role.belongsToMany(models.Permission, { through: models.RolePermission, foreignKey: 'role_id' });
    };

    return Role;
};
