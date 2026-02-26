import * as surveyService from './survey.service.js';

// POST /surveys/start
export const startSurvey = async (req, res, next) => {
    try {
        const result = await surveyService.startSurvey(req.body, req.user.id);
        res.status(201).json({ success: true, message: 'Survey started successfully.', data: result });
    } catch (error) { next(error); }
};

// POST /surveys/jobs/:jobId/proof
export const uploadProof = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No proof file uploaded.' });
        const result = await surveyService.uploadProof(req.params.jobId, req.file, req.user.id);
        res.json({ success: true, message: 'Proof uploaded successfully.', data: result });
    } catch (error) { next(error); }
};

// POST /surveys/jobs/:jobId/location
export const streamLocation = async (req, res, next) => {
    try {
        const result = await surveyService.streamLocation(req.params.jobId, req.body, req.user.id);
        res.json({ success: true, message: 'Location recorded.', data: result });
    } catch (error) { next(error); }
};

// POST /surveys
export const submitSurveyReport = async (req, res, next) => {
    try {
        const report = await surveyService.submitSurveyReport(req.body, req.files, req.user.id);
        res.status(201).json({ success: true, message: 'Survey report submitted successfully.', data: report });
    } catch (error) { next(error); }
};

// PUT /surveys/jobs/:jobId/finalize
export const finalizeSurvey = async (req, res, next) => {
    try {
        const result = await surveyService.finalizeSurvey(req.params.jobId, req.user.id);
        res.json({ success: true, message: 'Survey finalized. Job is now FINALIZED.', data: result });
    } catch (error) { next(error); }
};

// PUT /surveys/jobs/:jobId/rework
export const requestRework = async (req, res, next) => {
    try {
        const result = await surveyService.requestRework(req.params.jobId, req.body.reason, req.user.id);
        res.json({ success: true, message: 'Rework requested.', data: result });
    } catch (error) { next(error); }
};

// POST /surveys/jobs/:jobId/violation
export const flagViolation = async (req, res, next) => {
    try {
        const result = await surveyService.flagViolation(req.params.jobId, req.user.id);
        res.json({ success: true, message: 'Violation flagged and admins notified.', data: result });
    } catch (error) { next(error); }
};

// GET /surveys
export const getSurveyReports = async (req, res, next) => {
    try {
        const reports = await surveyService.getSurveyReports(req.query);
        res.json({ success: true, message: 'Survey reports fetched successfully.', data: reports });
    } catch (error) { next(error); }
};

// GET /surveys/jobs/:jobId
export const getSurveyDetails = async (req, res, next) => {
    try {
        const details = await surveyService.getSurveyDetails(req.params.jobId);
        res.json({ success: true, message: 'Survey details fetched successfully.', data: details });
    } catch (error) { next(error); }
};

// GET /surveys/jobs/:jobId/timeline
export const getTimeline = async (req, res, next) => {
    try {
        const result = await surveyService.getTimeline(req.params.jobId);
        res.json({ success: true, message: 'Survey timeline fetched successfully.', data: result });
    } catch (error) { next(error); }
};

// POST /surveys/jobs/:jobId/statement/draft
export const draftStatement = async (req, res, next) => {
    try {
        const result = await surveyService.draftSurveyStatement(req.params.jobId, req.body, req.user.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

// POST /surveys/jobs/:jobId/statement/issue
export const issueStatement = async (req, res, next) => {
    try {
        const result = await surveyService.issueSurveyStatement(req.params.jobId, req.file, req.user.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
