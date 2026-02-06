
export default (sequelize, DataTypes) => {
    const ProviderEvaluation = sequelize.define('ProviderEvaluation', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        provider_id: { type: DataTypes.UUID, allowNull: false },
        job_id: { type: DataTypes.UUID, allowNull: true },
        evaluated_by: { type: DataTypes.UUID, allowNull: false },

        // Specific score fields as requested
        punctuality_score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        quality_score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        documentation_score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        compliance_score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },

        average_rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // Auto-computed

        remarks: DataTypes.TEXT,
        result: {
            type: DataTypes.ENUM('PASS', 'FAIL', 'CONDITIONAL'),
            allowNull: false
        }
    }, {
        tableName: 'provider_evaluations',
        underscored: true,
        timestamps: true,
        updatedAt: false // Evaluations are historical records
    });

    ProviderEvaluation.associate = (models) => {
        ProviderEvaluation.belongsTo(models.ServiceProvider, { foreignKey: 'provider_id' });
        ProviderEvaluation.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        ProviderEvaluation.belongsTo(models.User, { as: 'Evaluator', foreignKey: 'evaluated_by' });
    };

    return ProviderEvaluation;
};
