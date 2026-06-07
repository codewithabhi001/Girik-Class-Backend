export default (sequelize, DataTypes) => {
    const ChecklistTemplateFile = sequelize.define('ChecklistTemplateFile', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        checklist_template_id: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'FK → checklist_templates.id'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Display name of the template document e.g. "Safety Management Plan", "Drill Records Sheet"'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Optional description of what this document is / what the surveyor should fill in'
        },
        file_key: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'S3 key of the blank master template file (to be downloaded & filled by surveyor)'
        },
        display_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Order in which documents are shown to the surveyor (0 = first)'
        },
        is_mandatory: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'If true, surveyor must upload a signed version before submitting the survey'
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: true
        }
    }, {
        tableName: 'checklist_template_files',
        underscored: true,
        timestamps: true,
    });

    ChecklistTemplateFile.associate = (models) => {
        ChecklistTemplateFile.belongsTo(models.ChecklistTemplate, {
            foreignKey: 'checklist_template_id',
            as: 'ChecklistTemplate'
        });
        ChecklistTemplateFile.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'Creator'
        });
        ChecklistTemplateFile.hasMany(models.SurveySignedDocument, {
            foreignKey: 'template_file_id',
            as: 'SignedDocuments'
        });
    };

    return ChecklistTemplateFile;
};
