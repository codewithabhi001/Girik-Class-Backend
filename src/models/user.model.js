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
            type: DataTypes.ENUM('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT'),
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
        profile_pic_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Security Fields
        failed_login_attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        locked_until: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_password_change_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        two_factor_secret: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        two_factor_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    }, {
        tableName: 'users',
        underscored: true,
        timestamps: true,
        hooks: {
            beforeValidate: (user) => {
                if (typeof user.email === 'string') {
                    user.email = user.email.toLowerCase().trim();
                }
            }
        }
    });

    User.associate = (models) => {
        User.belongsTo(models.Client, { foreignKey: 'client_id' });
        User.hasOne(models.SurveyorProfile, { foreignKey: 'user_id' });
        User.hasMany(models.JobRequest, { foreignKey: 'requested_by_user_id', as: 'ClientJobs' });
        User.hasMany(models.JobRequest, { foreignKey: 'assigned_surveyor_id', as: 'AssignedJobs' });
        User.hasMany(models.SupportTicket, { foreignKey: 'user_id', as: 'Tickets' });
        User.hasOne(models.NotificationPreference, { foreignKey: 'user_id', as: 'NotificationPreference' });
        
        // Security associations
        if (models.PasswordHistory) {
            User.hasMany(models.PasswordHistory, { foreignKey: 'user_id' });
        }
        if (models.UserSession) {
            User.hasMany(models.UserSession, { foreignKey: 'user_id' });
        }
    };

    return User;
};
