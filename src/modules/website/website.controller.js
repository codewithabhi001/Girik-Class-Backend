import * as websiteService from './website.service.js';

export const uploadVideo = async (req, res, next) => {
    try {
        const { section, title, description } = req.body;
        // thumbnail_url from body is likely ignored if they send a file, but let's check
        // check files
        const files = req.files || {};
        const videoFile = files['video'] ? files['video'][0] : null;

        let thumbnail = null;
        if (files['thumbnail']) thumbnail = files['thumbnail'][0];
        else if (files['thumbnail_url']) thumbnail = files['thumbnail_url'][0];

        if (!videoFile && !thumbnail && !req.body.videoKey && !req.body.thumbnailKey) {
            return res.status(400).json({ message: 'Either video/thumbnail file or videoKey/thumbnailKey is required' });
        }
        if (!section) {
            return res.status(400).json({ message: 'Section is required' });
        }

        const video = await websiteService.uploadVideo(videoFile, section, title, description, thumbnail, req.user.id, req.body);
        res.status(201).json(video);
    } catch (error) {
        next(error);
    }
};

export const getVideos = async (req, res, next) => {
    try {
        const { section } = req.query;
        const videos = await websiteService.getVideos(section);
        res.status(200).json(videos);
    } catch (error) {
        next(error);
    }
};

export const updateVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { section, title, description } = req.body;

        const files = req.files || {};
        const videoFile = files['video'] ? files['video'][0] : null;

        let thumbnail = null;
        if (files['thumbnail']) thumbnail = files['thumbnail'][0];
        else if (files['thumbnail_url']) thumbnail = files['thumbnail_url'][0];

        const updatedVideo = await websiteService.updateVideo(id, { section, title, description, ...req.body }, videoFile, thumbnail);
        res.status(200).json(updatedVideo);
    } catch (error) {
        next(error);
    }
};

export const deleteVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        await websiteService.deleteVideo(id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
