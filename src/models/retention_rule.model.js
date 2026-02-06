
export default (sequelize, DataTypes) => {
    const RetentionRule = sequelize.define('RetentionRule', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        entity_type: { type: DataTypes.STRING, allowNull: false, unique: true, comment: 'SURVEY_PHOTOS, CERTIFICATES, etc.' },
        retain_years: { type: DataTypes.INTEGER, allowNull: false },
        action: { type: DataTypes.ENUM('PURGE', 'ARCHIVE'), defaultValue: 'PURGE' },
        description: DataTypes.TEXT,
    }, {
        tableName: 'retention_rules',
        underscored: true,
        timestamps: true,
    });

    return RetentionRule;
};
