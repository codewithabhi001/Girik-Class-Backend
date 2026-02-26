export default (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN'),
            allowNull: false,
        },
        phone: DataTypes.STRING,
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
            defaultValue: 'ACTIVE',
        },
        client_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        force_password_reset: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        last_login_at: DataTypes.DATE,
        fcm_token: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'users',
        underscored: true,
        timestamps: true,
    });

    User.associate = (models) => {
        User.belongsTo(models.Client, { foreignKey: 'client_id' });
        User.hasOne(models.SurveyorProfile, { foreignKey: 'user_id' });
        User.hasMany(models.JobRequest, { foreignKey: 'requested_by_user_id', as: 'ClientJobs' });
        User.hasMany(models.JobRequest, { foreignKey: 'assigned_surveyor_id', as: 'AssignedJobs' });
        User.hasMany(models.SupportTicket, { foreignKey: 'user_id', as: 'Tickets' });
    };

    return User;
};
