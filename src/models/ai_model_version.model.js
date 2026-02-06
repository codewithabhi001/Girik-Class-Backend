
export default (sequelize, DataTypes) => {
    const AiModelVersion = sequelize.define('AiModelVersion', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        model_name: { type: DataTypes.STRING, allowNull: false },
        version: { type: DataTypes.STRING, allowNull: false },
        description: DataTypes.TEXT,
        metrics_json: { type: DataTypes.JSON, comment: 'Accuracy, F1 score, etc.' },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
        trained_at: DataTypes.DATE,
        trained_by: DataTypes.UUID,
    }, {
        tableName: 'ai_model_versions',
        underscored: true,
        timestamps: true,
    });

    return AiModelVersion;
};
