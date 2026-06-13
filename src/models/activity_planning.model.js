export default (sequelize, DataTypes) => {
    const ActivityPlanning = sequelize.define('ActivityPlanning', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: { type: DataTypes.UUID, allowNull: true },            // kept for legacy compat
        job_certificate_id: { type: DataTypes.UUID, allowNull: true }, // per-certificate checklist
        question_code: DataTypes.STRING,
        question_text: DataTypes.STRING,
        answer: DataTypes.STRING,
        remarks: DataTypes.TEXT,
        file_url: DataTypes.STRING,
        status: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
            defaultValue: 'PENDING'
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'activity_plannings',
        underscored: true,
        timestamps: true,
    });

    ActivityPlanning.associate = (models) => {
        ActivityPlanning.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        ActivityPlanning.belongsTo(models.JobCertificate, { foreignKey: 'job_certificate_id' });
    };

    return ActivityPlanning;
};
