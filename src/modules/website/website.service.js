import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';

const WebsiteVideo = db.WebsiteVideo;

export const uploadVideo = async (file, section, title, description, thumbnailFile, userId) => {
    const folder = s3Service.UPLOAD_FOLDERS.WEBSITE_VIDEOS || 'website/videos';
    const videoUrl = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, folder);

    let thumbnailUrl = null;
    if (thumbnailFile) {
        // Check if thumbnailFile is a file object or a string (just in case)
        if (thumbnailFile.buffer) {
            thumbnailUrl = await s3Service.uploadFile(thumbnailFile.buffer, thumbnailFile.originalname, thumbnailFile.mimetype, folder + '/thumbnails');
        } else if (typeof thumbnailFile === 'string') {
            thumbnailUrl = thumbnailFile;
        }
    }

    return await WebsiteVideo.create({
        section: section,
        title: title,
        description: description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        uploaded_by: userId
    });
};

export const getVideos = async (section) => {
    const whereClause = {};
    if (section) {
        whereClause.section = section;
    }

    return await WebsiteVideo.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
    });
};

export const updateVideo = async (id, data, videoFile, thumbnailFile) => {
    const video = await WebsiteVideo.findByPk(id);
    if (!video) throw { statusCode: 404, message: 'Video not found' };

    const folder = s3Service.UPLOAD_FOLDERS.WEBSITE_VIDEOS || 'website/videos';
    const updates = { ...data };

    if (videoFile) {
        const videoUrl = await s3Service.uploadFile(videoFile.buffer, videoFile.originalname, videoFile.mimetype, folder);
        updates.video_url = videoUrl;
    }

    if (thumbnailFile) {
        let thumbnailUrl = null;
        if (thumbnailFile.buffer) {
            thumbnailUrl = await s3Service.uploadFile(thumbnailFile.buffer, thumbnailFile.originalname, thumbnailFile.mimetype, folder + '/thumbnails');
        } else if (typeof thumbnailFile === 'string') {
            thumbnailUrl = thumbnailFile;
        }
        updates.thumbnail_url = thumbnailUrl;
    }

    return await video.update(updates);
};

export const deleteVideo = async (id) => {
    const video = await WebsiteVideo.findByPk(id);
    if (!video) throw { statusCode: 404, message: 'Video not found' };

    return await video.destroy();
};
