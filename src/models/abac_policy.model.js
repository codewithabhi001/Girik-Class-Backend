
export default (sequelize, DataTypes) => {
    const AbacPolicy = sequelize.define('AbacPolicy', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        resource: { type: DataTypes.STRING, allowNull: false },
        condition_script: { type: DataTypes.TEXT, allowNull: false, comment: 'JS-like condition: user.id == resource.owner_id' },
        effect: { type: DataTypes.ENUM('ALLOW', 'DENY'), defaultValue: 'ALLOW' },
        description: DataTypes.TEXT,
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        tableName: 'abac_policies',
        underscored: true,
        timestamps: true,
    });

    return AbacPolicy;
};
