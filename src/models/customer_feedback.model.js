
export default (sequelize, DataTypes) => {
    const CustomerFeedback = sequelize.define('CustomerFeedback', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: { type: DataTypes.UUID, allowNull: false },
        client_id: { type: DataTypes.UUID, allowNull: false },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 }
        },
        timeliness: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 }
        },
        professionalism: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 }
        },
        documentation: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 }
        },
        remarks: DataTypes.TEXT,
        submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'customer_feedbacks',
        underscored: true,
        timestamps: true,
        updatedAt: false // Feedback is a point-in-time record
    });

    CustomerFeedback.associate = (models) => {
        CustomerFeedback.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        CustomerFeedback.belongsTo(models.User, { as: 'Client', foreignKey: 'client_id' });
    };

    return CustomerFeedback;
};
