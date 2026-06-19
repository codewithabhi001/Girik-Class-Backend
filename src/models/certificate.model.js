export default (sequelize, DataTypes) => {
    const Certificate = sequelize.define('Certificate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        vessel_id: DataTypes.UUID,
        client_id: DataTypes.UUID,
        job_id: DataTypes.UUID,
        certificate_type_id: DataTypes.UUID,
        certificate_number: { type: DataTypes.STRING, unique: true },
        source_type: {
            type: DataTypes.ENUM('INTERNAL', 'EXTERNAL'),
            defaultValue: 'INTERNAL'
        },
        certificate_term: {
            type: DataTypes.ENUM('FULL_TERM', 'SHORT_TERM'),
            allowNull: true,
            defaultValue: null
        },
        flag_administration_id: DataTypes.UUID,
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },

        remarks: DataTypes.TEXT,
        issue_date: DataTypes.DATEONLY,
        expiry_date: DataTypes.DATEONLY,
        status: { 
            type: DataTypes.ENUM('DRAFT', 'ISSUED', 'VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'TRANSFERRED', 'DOWNGRADED'), 
            defaultValue: 'DRAFT' 
        },
        qr_code_url: DataTypes.STRING,
        pdf_file_url: DataTypes.STRING,
        uploaded_file_url: {
            type: DataTypes.STRING,
            comment: 'S3 key for external certificates'
        },
        is_manually_overridden: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Flag indicating if the system generated certificate was manually replaced'
        },
        manually_overridden_file_url: {
            type: DataTypes.STRING,
            comment: 'S3 key for the manually uploaded overridden certificate'
        },
        generated_pdf_url: {
            type: DataTypes.STRING,
            comment: 'S3 key for system generated certificates'
        },
        custom_html: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
            comment: 'Custom HTML content after manual updates/compilation'
        },
        issued_at: DataTypes.DATE,
        issued_by_user_id: DataTypes.UUID,
        signature_url: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Custom signature S3 URL override for this specific certificate instance'
        },
    }, {
        tableName: 'certificates',
        underscored: true,
        timestamps: true,
    });

    Certificate.associate = (models) => {
        Certificate.belongsTo(models.Vessel, { foreignKey: 'vessel_id' });
        Certificate.belongsTo(models.Client, { foreignKey: 'client_id', as: 'Client' });
        Certificate.belongsTo(models.JobRequest, { foreignKey: 'job_id' });
        Certificate.belongsTo(models.CertificateType, { foreignKey: 'certificate_type_id' });
        Certificate.belongsTo(models.FlagAdministration, { foreignKey: 'flag_administration_id', as: 'FlagState' });
        Certificate.belongsTo(models.User, { foreignKey: 'issued_by_user_id', as: 'issuer' });
        Certificate.hasMany(models.CertificateHistory, { foreignKey: 'certificate_id' });
    };

    return Certificate;
};
