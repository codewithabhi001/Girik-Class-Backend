import { v4 as uuidv4 } from 'uuid';

export default (sequelize, DataTypes) => {
    const WebsiteVideo = sequelize.define('WebsiteVideo', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        section: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Section on the website e.g., HOME, PORTFOLIO'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        video_url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        thumbnail_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        uploaded_by: {
            type: DataTypes.UUID,
            allowNull: true
        }
    }, {
        tableName: 'website_videos',
        timestamps: true,
        underscored: true
    });

    WebsiteVideo.associate = (models) => {
        WebsiteVideo.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
    };

    return WebsiteVideo;
};
