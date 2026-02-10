import * as surveyorService from './surveyor.service.js';

export const applySurveyor = async (req, res, next) => {
    try {
        const application = await surveyorService.applySurveyor(req.body, req.files);
        res.status(201).json({
            success: true,
            message: 'Surveyor application submitted successfully',
            data: application
        });
    } catch (error) { next(error); }
};

export const getApplications = async (req, res, next) => {
    try {
        const result = await surveyorService.getApplications(req.query);
        res.json({
            success: true,
            message: 'Applications fetched successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const reviewApplication = async (req, res, next) => {
    try {
        const { status, remarks } = req.body;
        const result = await surveyorService.reviewApplication(req.params.id, status, remarks, req.user.id);
        res.json({
            success: true,
            message: `Application ${status.toLowerCase()} successfully`,
            data: result
        });
    } catch (error) { next(error); }
};

export const getProfile = async (req, res, next) => {
    try {
        const profile = await surveyorService.getProfile(req.params.id);
        res.json({
            success: true,
            message: 'Profile fetched successfully',
            data: profile
        });
    } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
    try {
        const profile = await surveyorService.updateProfile(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: profile
        });
    } catch (error) { next(error); }
};

export const createSurveyor = async (req, res, next) => {
    try {
        const result = await surveyorService.createSurveyor(req.body);
        res.status(201).json({
            success: true,
            message: 'Surveyor created successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const updateAvailability = async (req, res, next) => {
    try {
        const profile = await surveyorService.updateAvailability(req.user.id, req.body.isOnline);
        res.json({ success: true, data: profile });
    } catch (e) { next(e); }
};

export const reportLocation = async (req, res, next) => {
    try {
        const result = await surveyorService.reportLocation(req.user.id, req.body);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getGPSHistory = async (req, res, next) => {
    try {
        const history = await surveyorService.getGPSHistory(req.params.id);
        res.json({ success: true, data: history });
    } catch (e) { next(e); }
};
