
import * as aiService from './ai.service.js';

export const getAnomalies = async (req, res, next) => {
    try {
        const result = await aiService.detectAnomalies();
        res.json(result);
    } catch (e) { next(e); }
};

export const getSurveyQuality = async (req, res, next) => {
    try {
        const result = await aiService.evaluateSurveyQuality();
        res.json(result);
    } catch (e) { next(e); }
};

export const getRiskScore = async (req, res, next) => {
    try {
        const result = await aiService.calculateRiskScore();
        res.json(result);
    } catch (e) { next(e); }
};
