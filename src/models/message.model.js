export default (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: DataTypes.UUID,
        sender_id: DataTypes.UUID,
        message_text: DataTypes.TEXT,
        is_internal: { type: DataTypes.BOOLEAN, defaultValue: false }, // If true, only visible to staff
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'messages',
        underscored: true,
        timestamps: false,
    });

    Message.associate = (models) => {
        Message.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        Message.belongsTo(models.User, { foreignKey: 'sender_id', as: 'Sender' });
    };

    return Message;
};
