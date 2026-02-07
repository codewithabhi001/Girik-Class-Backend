import * as surveyService from './survey.service.js';

// Assume multer middleware handles file parsing and puts it in req.file
export const submitSurveyReport = async (req, res, next) => {
    try {
        const report = await surveyService.submitSurveyReport(req.body, req.file, req.user);
        res.status(201).json({
            success: true,
            message: 'Survey report submitted successfully',
            data: report
        });
    } catch (error) {
        next(error);
    }
};

export const startSurvey = async (req, res, next) => {
    try {
        const result = await surveyService.startSurvey(req.body, req.user);
        res.status(201).json({
            success: true,
            message: 'Survey started successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const finalizeSurvey = async (req, res, next) => {
    try {
        const result = await surveyService.finalizeSurvey(req.params.id, req.user);
        res.json({
            success: true,
            message: 'Survey finalized successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const streamLocation = async (req, res, next) => {
    try {
        const result = await surveyService.streamLocation(req.params.id, req.body, req.user);
        res.json({
            success: true,
            message: 'Location streamed successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const uploadProof = async (req, res, next) => {
    try {
        const result = await surveyService.uploadProof(req.params.id, req.file, req.user);
        res.json({
            success: true,
            message: 'Proof uploaded successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getTimeline = async (req, res, next) => {
    try {
        const result = await surveyService.getTimeline(req.params.id);
        res.json({
            success: true,
            message: 'Survey timeline fetched successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const flagViolation = async (req, res, next) => {
    try {
        const result = await surveyService.flagViolation(req.params.id, req.user);
        res.json({
            success: true,
            message: 'Violation flagged successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getSurveyReports = async (req, res, next) => {
    try {
        const reports = await surveyService.getSurveyReports(req.query);
        res.json({
            success: true,
            message: 'Survey reports fetched successfully',
            data: reports
        });
    } catch (error) {
        next(error);
    }
};
