export default (sequelize, DataTypes) => {
    const PasswordHistory = sequelize.define('PasswordHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'password_histories',
        underscored: true,
        timestamps: true,
    });

    PasswordHistory.associate = (models) => {
        PasswordHistory.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return PasswordHistory;
};
