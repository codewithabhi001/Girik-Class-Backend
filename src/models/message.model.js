export default (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        job_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        sender_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        message_text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_internal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        attachment_url: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'messages',
        underscored: true,
        timestamps: true,
        updatedAt: true
    });

    Message.associate = (models) => {
        Message.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        Message.belongsTo(models.User, { as: 'Sender', foreignKey: 'sender_id' });
    };

    return Message;
};
