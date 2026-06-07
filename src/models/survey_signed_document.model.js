export default (sequelize, DataTypes) => {
    const SurveySignedDocument = sequelize.define('SurveySignedDocument', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        survey_id: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'FK → surveys.id'
        },
        job_certificate_id: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'FK → job_certificates.id — which certificate this signed doc belongs to'
        },
        template_file_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'FK → checklist_template_files.id — which blank template this is a signed version of. Null for legacy uploads.'
        },
        template_file_name: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Snapshot of the template file name at time of upload (in case template changes later)'
        },
        file_key: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'S3 key of the surveyor-uploaded signed document'
        },
        file_name: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Human-readable filename'
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'WAIVED'),
            allowNull: false,
            defaultValue: 'PENDING',
            comment: 'Review status set by TO/TM'
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for rejection — required when status = REJECTED'
        },
        reviewed_by: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'FK → users.id — who approved/rejected this document'
        },
        reviewed_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when the review action was taken'
        },
        submitted_by: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'FK → users.id — which surveyor uploaded this document'
        }
    }, {
        tableName: 'survey_signed_documents',
        underscored: true,
        timestamps: true,
    });

    SurveySignedDocument.associate = (models) => {
        SurveySignedDocument.belongsTo(models.Survey, {
            foreignKey: 'survey_id',
            as: 'Survey'
        });
        SurveySignedDocument.belongsTo(models.JobCertificate, {
            foreignKey: 'job_certificate_id',
            as: 'JobCertificate'
        });
        SurveySignedDocument.belongsTo(models.ChecklistTemplateFile, {
            foreignKey: 'template_file_id',
            as: 'TemplateFile'
        });
        SurveySignedDocument.belongsTo(models.User, {
            foreignKey: 'reviewed_by',
            as: 'Reviewer'
        });
        SurveySignedDocument.belongsTo(models.User, {
            foreignKey: 'submitted_by',
            as: 'Submitter'
        });
    };

    return SurveySignedDocument;
};
