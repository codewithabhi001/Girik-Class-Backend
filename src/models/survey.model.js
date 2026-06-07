export default (sequelize, DataTypes) => {
    const Survey = sequelize.define('Survey', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        job_certificate_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        },
        surveyor_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        survey_status: {
            type: DataTypes.ENUM(
                'NOT_STARTED',
                'STARTED',
                'CHECKLIST_SUBMITTED',
                'PROOF_UPLOADED',
                'SUBMITTED',
                'REWORK_REQUIRED',
                'FINALIZED'
            ),
            defaultValue: 'NOT_STARTED'
        },
        submission_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        // Report Data (Merged from SurveyReport for Single-Survey-per-Job approach)
        start_latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true
        },
        start_longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true
        },
        submit_latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true
        },
        submit_longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true
        },
        attendance_photo_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        signature_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        survey_statement: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        declaration_hash: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        // Evidence Proof (Last uploaded)
        evidence_proof_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Timing
        started_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        finalized_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        declared_by: {
            type: DataTypes.UUID,
            allowNull: true
        },
        declared_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        survey_statement_status: {
            type: DataTypes.ENUM('NOT_PREPARED', 'DRAFTED', 'ISSUED'),
            defaultValue: 'NOT_PREPARED'
        },
        survey_statement_pdf_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        signed_checklist_files: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of objects [{url: string, status: string, rejection_reason: string}] for the final signed scans'
        }
    }, {
        tableName: 'surveys',
        underscored: true,
        timestamps: true
    });

    Survey.associate = (models) => {
        Survey.belongsTo(models.JobCertificate, { foreignKey: 'job_certificate_id' });
        Survey.belongsTo(models.User, { foreignKey: 'surveyor_id' });
        Survey.belongsTo(models.User, { foreignKey: 'declared_by', as: 'Declarer' });
        Survey.hasMany(models.SurveyStatusHistory, { foreignKey: 'survey_id' });
        Survey.hasMany(models.SurveySignedDocument, { foreignKey: 'survey_id', as: 'SignedDocuments' });
    };

    return Survey;
};
