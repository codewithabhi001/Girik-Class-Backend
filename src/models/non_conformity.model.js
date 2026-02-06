export default (sequelize, DataTypes) => {
    const NonConformity = sequelize.define('NonConformity', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        job_id: DataTypes.UUID,
        description: DataTypes.TEXT,
        severity: DataTypes.ENUM('MINOR', 'MAJOR', 'CRITICAL'),
        status: { type: DataTypes.ENUM('OPEN', 'CLOSED'), defaultValue: 'OPEN' },
        closure_remarks: DataTypes.TEXT,
        closed_at: DataTypes.DATE,
    }, {
        tableName: 'non_conformities',
        underscored: true,
        timestamps: false,
    });

    NonConformity.associate = (models) => {
        NonConformity.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
    };

    return NonConformity;
};
