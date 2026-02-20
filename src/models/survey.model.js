export default (sequelize, DataTypes) => {
    const Survey = sequelize.define('Survey', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV7,
            primaryKey: true
        },
        job_id: {
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
        gps_latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true
        },
        gps_longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true
        },
        attendance_photo_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        survey_statement: {
            type: DataTypes.TEXT,
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
        }
    }, {
        tableName: 'surveys',
        underscored: true,
        timestamps: true
    });

    Survey.associate = (models) => {
        Survey.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        Survey.belongsTo(models.User, { foreignKey: 'surveyor_id' });
        Survey.hasMany(models.SurveyStatusHistory, { foreignKey: 'survey_id' });
    };

    return Survey;
};
