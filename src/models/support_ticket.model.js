export default (sequelize, DataTypes) => {
    const SupportTicket = sequelize.define('SupportTicket', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
            defaultValue: 'OPEN'
        },
        priority: {
            type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
            defaultValue: 'MEDIUM'
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true
        },
        resolved_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        resolved_by: {
            type: DataTypes.UUID,
            allowNull: true
        }
    }, {
        tableName: 'support_tickets',
        underscored: true,
        timestamps: true
    });

    SupportTicket.associate = (models) => {
        SupportTicket.belongsTo(models.User, { foreignKey: 'user_id', as: 'Creator' });
        SupportTicket.belongsTo(models.User, { foreignKey: 'resolved_by', as: 'Resolver' });
    };

    return SupportTicket;
};
