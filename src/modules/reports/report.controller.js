import * as reportService from './report.service.js';
import {
    generateCertificateDocx,
    generateSurveyorDocx,
    generateNonConformityDocx,
    generateFinancialDocx
} from './report.service.js';

export const getCertificateReport = async (req, res, next) => {
    try {
        if (req.query.format === 'docx') {
            const buffer = await generateCertificateDocx(req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', 'attachment; filename="certificate_report.docx"');
            return res.send(buffer);
        }
        const report = await reportService.getCertificateReport(req.query);
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const getSurveyorReport = async (req, res, next) => {
    try {
        if (req.query.format === 'docx') {
            const buffer = await generateSurveyorDocx(req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', 'attachment; filename="surveyor_report.docx"');
            return res.send(buffer);
        }
        const report = await reportService.getSurveyorPerformanceReport(req.query);
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const getNonConformityReport = async (req, res, next) => {
    try {
        if (req.query.format === 'docx') {
            const buffer = await generateNonConformityDocx(req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', 'attachment; filename="nonconformity_report.docx"');
            return res.send(buffer);
        }
        const report = await reportService.getNonConformityReport(req.query);
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const getFinancialReport = async (req, res, next) => {
    try {
        if (req.query.format === 'docx') {
            const buffer = await generateFinancialDocx(req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', 'attachment; filename="financial_report.docx"');
            return res.send(buffer);
        }
        const report = await reportService.getFinancialReport(req.query);
        res.json(report);
    } catch (error) {
        next(error);
    }
};

export const getSurveyStatusReport = async (req, res, next) => {
    try {
        const { html, data } = await reportService.getSurveyStatusReportData(req.query);
        if (req.query.format === 'json') {
            return res.json(data);
        }
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (error) {
        next(error);
    }
};

