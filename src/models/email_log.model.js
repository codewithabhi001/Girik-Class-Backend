export default (sequelize, DataTypes) => {
    const EmailLog = sequelize.define('EmailLog', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        recipient: DataTypes.STRING,
        subject: DataTypes.STRING,
        status: { type: DataTypes.ENUM('SENT', 'FAILED'), defaultValue: 'SENT' },
        sent_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'email_logs',
        underscored: true,
        timestamps: false,
    });

    return EmailLog;
};
