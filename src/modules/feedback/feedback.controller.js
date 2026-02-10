import * as feedbackService from './feedback.service.js';

export const submitFeedback = async (req, res, next) => {
    try {
        const feedback = await feedbackService.submitFeedback(req.body, req.user.id, req.user.client_id);
        res.status(201).json({ success: true, data: feedback });
    } catch (error) { next(error); }
};

export const getFeedbackForJob = async (req, res, next) => {
    try {
        const feedback = await feedbackService.getFeedbackForJob(req.params.jobId);
        res.json({ success: true, data: feedback });
    } catch (error) { next(error); }
};

export const getAllFeedback = async (req, res, next) => {
    try {
        const result = await feedbackService.getAllFeedback(req.query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};
