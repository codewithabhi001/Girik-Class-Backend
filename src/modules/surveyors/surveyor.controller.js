import * as surveyorService from './surveyor.service.js';

export const applySurveyor = async (req, res, next) => {
    try {
        // req.files is populated by multer
        const application = await surveyorService.applySurveyor(req.body, req.files);
        res.status(201).json(application);
    } catch (error) {
        next(error);
    }
};

export const getApplications = async (req, res, next) => {
    try {
        const result = await surveyorService.getApplications(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const reviewApplication = async (req, res, next) => {
    try {
        const { status, remarks } = req.body;
        const result = await surveyorService.reviewApplication(req.params.id, status, remarks, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const profile = await surveyorService.getProfile(req.params.id);
        res.json(profile);
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const profile = await surveyorService.updateProfile(req.params.id, req.body);
        res.json(profile);
    } catch (error) {
        next(error);
    }
};
