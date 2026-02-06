
import * as feedbackService from './feedback.service.js';

export const submitFeedback = async (req, res, next) => {
    try {
        const feedback = await feedbackService.submitFeedback(req.body, req.user);
        res.status(201).json(feedback);
    } catch (error) {
        next(error);
    }
};

export const getFeedbackForJob = async (req, res, next) => {
    try {
        const feedback = await feedbackService.getFeedbackForJob(req.params.jobId);
        res.json(feedback);
    } catch (error) {
        next(error);
    }
};

export const getAllFeedback = async (req, res, next) => {
    try {
        const result = await feedbackService.getAllFeedback(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
