
export default (sequelize, DataTypes) => {
    const ActivityRequest = sequelize.define('ActivityRequest', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        request_number: { type: DataTypes.STRING, unique: true },
        requested_by: { type: DataTypes.UUID, allowNull: false },
        vessel_id: { type: DataTypes.UUID, allowNull: true, comment: 'Vessel ID (for Client requests)' },
        activity_type: {
            type: DataTypes.ENUM('INSPECTION', 'AUDIT', 'TRAINING', 'VISIT', 'OTHER'),
            allowNull: false
        },
        requested_service: { type: DataTypes.STRING, comment: 'Specific service name e.g. "Annual Survey"' },
        priority: {
            type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
            defaultValue: 'MEDIUM'
        },
        description: DataTypes.TEXT,
        location_port: DataTypes.STRING,
        proposed_date: DataTypes.DATE,
        status: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED_TO_JOB', 'DRAFT'),
            defaultValue: 'PENDING'
        },
        linked_job_id: { type: DataTypes.UUID, allowNull: true },
        rejection_reason: DataTypes.STRING,
        attachments: { type: DataTypes.JSON, defaultValue: [] }
    }, {
        tableName: 'activity_requests',
        underscored: true,
        timestamps: true,
        paranoid: true
    });

    ActivityRequest.associate = (models) => {
        ActivityRequest.belongsTo(models.User, { as: 'Requester', foreignKey: 'requested_by' });
        ActivityRequest.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
        ActivityRequest.belongsTo(models.JobRequest, { as: 'LinkedJob', foreignKey: 'linked_job_id' });
    };

    return ActivityRequest;
};
