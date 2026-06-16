export default (sequelize, DataTypes) => {
    const SystemIssueReport = sequelize.define('SystemIssueReport', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        stack_trace: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        page_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        user_agent: {
            type: DataTypes.STRING(1024),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED'),
            defaultValue: 'OPEN',
            allowNull: false
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
        tableName: 'system_issue_reports',
        underscored: true,
        timestamps: true
    });

    SystemIssueReport.associate = (models) => {
        SystemIssueReport.belongsTo(models.User, { foreignKey: 'user_id', as: 'Reporter' });
        SystemIssueReport.belongsTo(models.User, { foreignKey: 'resolved_by', as: 'Resolver' });
    };

    return SystemIssueReport;
};
