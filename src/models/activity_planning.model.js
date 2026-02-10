export default (sequelize, DataTypes) => {
    const ActivityPlanning = sequelize.define('ActivityPlanning', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: DataTypes.UUID,
        question_code: DataTypes.STRING,
        question_text: DataTypes.STRING,
        answer: DataTypes.ENUM('YES', 'NO', 'NA'),
        remarks: DataTypes.TEXT,
    }, {
        tableName: 'activity_plannings',
        underscored: true,
        timestamps: true,
    });

    ActivityPlanning.associate = (models) => {
        ActivityPlanning.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
    };

    return ActivityPlanning;
};
