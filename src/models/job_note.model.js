export default (sequelize, DataTypes) => {
    const JobNote = sequelize.define('JobNote', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        job_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        note_text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_internal: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'job_notes',
        underscored: true,
        timestamps: true
    });

    JobNote.associate = (models) => {
        JobNote.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        JobNote.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return JobNote;
};
