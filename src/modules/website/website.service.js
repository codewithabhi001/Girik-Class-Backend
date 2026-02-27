import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';

const WebsiteVideo = db.WebsiteVideo;

export const uploadVideo = async (file, section, title, description, thumbnailFile, userId, data = {}) => {
    const folder = s3Service.UPLOAD_FOLDERS.WEBSITE_VIDEOS || 'website/videos';

    let videoUrl = data.videoKey || null;
    if (file) {
        videoUrl = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, folder);
    }

    let thumbnailUrl = data.thumbnailKey || null;
    if (thumbnailFile) {
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

    const videos = await WebsiteVideo.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
    });

    // Transform URLs for delivery
    for (const v of videos) {
        if (v.video_url) {
            const key = fileAccessService.getKeyFromUrl(v.video_url);
            let url = fileAccessService.generatePublicCdnUrl(key);
            if (!url) {
                // Fallback to signed URL for legacy/private uploads
                url = await fileAccessService.generateSignedUrl(key, 3600);
            }
            v.setDataValue('video_url', url);
        }
        if (v.thumbnail_url) {
            const key = fileAccessService.getKeyFromUrl(v.thumbnail_url);
            let url = fileAccessService.generatePublicCdnUrl(key);
            if (!url) {
                url = await fileAccessService.generateSignedUrl(key, 3600);
            }
            v.setDataValue('thumbnail_url', url);
        }
    }

    return videos;
};

export const updateVideo = async (id, data, videoFile, thumbnailFile) => {
    const video = await WebsiteVideo.findByPk(id);
    if (!video) throw { statusCode: 404, message: 'Video not found' };

    const folder = s3Service.UPLOAD_FOLDERS.WEBSITE_VIDEOS || 'website/videos';
    const updates = { ...data };

    if (data.videoKey) {
        updates.video_url = data.videoKey;
    } else if (videoFile) {
        const videoUrl = await s3Service.uploadFile(videoFile.buffer, videoFile.originalname, videoFile.mimetype, folder);
        updates.video_url = videoUrl;
    }

    if (data.thumbnailKey) {
        updates.thumbnail_url = data.thumbnailKey;
    } else if (thumbnailFile) {
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
