export default (sequelize, DataTypes) => {
    const Permission = sequelize.define('Permission', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true,
        },
        permission_name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: DataTypes.TEXT,
    }, {
        tableName: 'permissions',
        underscored: true,
        timestamps: false,
    });

    Permission.associate = (models) => {
        Permission.belongsToMany(models.Role, { through: models.RolePermission, foreignKey: 'permission_id' });
    };

    return Permission;
};
