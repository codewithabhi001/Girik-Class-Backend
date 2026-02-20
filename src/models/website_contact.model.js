export default (sequelize, DataTypes) => {
    const WebsiteContact = sequelize.define('WebsiteContact', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        company: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        corporate_email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isEmail: true },
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('NEW', 'READ', 'REPLIED', 'ARCHIVED'),
            defaultValue: 'NEW',
        },
        internal_note: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Admin/GM internal note about this enquiry',
        },
        replied_by: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'User ID of the admin/GM who replied',
        },
        replied_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Originating IP for spam control',
        },
        source_page: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'CONTACT',
            comment: 'Which page the message came from, e.g. CONTACT, HOME',
        },
    }, {
        tableName: 'website_contacts',
        timestamps: true,
        underscored: true,
    });

    WebsiteContact.associate = (models) => {
        WebsiteContact.belongsTo(models.User, {
            foreignKey: 'replied_by',
            as: 'Responder',
        });
    };

    return WebsiteContact;
};
