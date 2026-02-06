
export default (sequelize, DataTypes) => {
    const ChecklistTemplate = sequelize.define('ChecklistTemplate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        code: { type: DataTypes.STRING, unique: true, allowNull: false },
        description: DataTypes.TEXT,
        sections: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            comment: 'Array of sections with questions: [{ title, items: [{ code, text, type }] }]'
        },
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'DRAFT'), defaultValue: 'DRAFT' },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {},
            comment: 'Additional config like version, applicable_vessel_types, etc.'
        },
        created_by: DataTypes.UUID,
        updated_by: DataTypes.UUID
    }, {
        tableName: 'checklist_templates',
        underscored: true,
        timestamps: true,
    });

    ChecklistTemplate.associate = (models) => {
        ChecklistTemplate.belongsTo(models.User, { as: 'Creator', foreignKey: 'created_by' });
        ChecklistTemplate.belongsTo(models.User, { as: 'Updater', foreignKey: 'updated_by' });
    };

    return ChecklistTemplate;
};
