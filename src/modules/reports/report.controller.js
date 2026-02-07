import * as reportService from './report.service.js';

export const getCertificateReport = async (req, res, next) => {
    try {
        const report = await reportService.getCertificateReport(req.query);
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const getSurveyorReport = async (req, res, next) => {
    try {
        const report = await reportService.getSurveyorPerformanceReport(req.query);
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const getNonConformityReport = async (req, res, next) => {
    try {
        const report = await reportService.getNonConformityReport(req.query);
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const getFinancialReport = async (req, res, next) => {
    try {
        const report = await reportService.getFinancialReport(req.query);
        res.json(report);
    } catch (error) {
        next(error);
    }
};
