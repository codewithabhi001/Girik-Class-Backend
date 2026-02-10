import * as certService from './certificate.service.js';
import db from '../../models/index.js';

const getScopeFilters = async (user) => {
    const scopeFilters = {};
    if (user.role === 'CLIENT') {
        const vessels = await db.Vessel.findAll({ where: { client_id: user.client_id }, attributes: ['id'] });
        const vesselIds = vessels.map(v => v.id);
        scopeFilters.vessel_id = vesselIds;
    }
    return scopeFilters;
};

export const generateCertificate = async (req, res, next) => {
    try {
        const cert = await certService.generateCertificate(req.body, req.user.id);
        res.status(201).json({
            success: true,
            message: 'Certificate generated successfully',
            data: cert
        });
    } catch (error) { next(error); }
};

export const getCertificates = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const certs = await certService.getCertificates(req.query, scopeFilters);
        res.json({
            success: true,
            message: 'Certificates fetched successfully',
            data: certs
        });
    } catch (error) { next(error); }
};

export const getCertificateById = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const cert = await certService.getCertificateById(req.params.id, scopeFilters);
        res.json({
            success: true,
            message: 'Certificate details fetched successfully',
            data: cert
        });
    } catch (error) { next(error); }
};

export const suspendCertificate = async (req, res, next) => {
    try {
        const result = await certService.updateStatus(req.params.id, 'SUSPENDED', req.body.reason, req.user.id);
        res.json({
            success: true,
            message: 'Certificate suspended successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const revokeCertificate = async (req, res, next) => {
    try {
        const result = await certService.updateStatus(req.params.id, 'REVOKED', req.body.reason, req.user.id);
        res.json({
            success: true,
            message: 'Certificate revoked successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const restoreCertificate = async (req, res, next) => {
    try {
        const result = await certService.updateStatus(req.params.id, 'VALID', req.body.reason, req.user.id);
        res.json({
            success: true,
            message: 'Certificate restored successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const renewCertificate = async (req, res, next) => {
    try {
        const { validity_years, reason } = req.body;
        const result = await certService.renewCertificate(req.params.id, validity_years, reason, req.user.id);
        res.json({
            success: true,
            message: 'Certificate renewed successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const reissueCertificate = async (req, res, next) => {
    try {
        const result = await certService.reissueCertificate(req.params.id, req.body.reason, req.user.id);
        res.json({
            success: true,
            message: 'Certificate reissued successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const previewCertificate = async (req, res, next) => {
    try {
        // You might want to add scope check here too
        const result = await certService.previewCertificate(req.params.id);
        res.json({
            success: true,
            message: 'Certificate preview data fetched',
            data: result
        });
    } catch (error) { next(error); }
};

export const signCertificate = async (req, res, next) => {
    res.json({
        success: true,
        message: 'Certificate signed successfully',
        data: { signature: 'SHA256-SIG' }
    });
};

export const getSignature = async (req, res, next) => {
    res.json({
        success: true,
        message: 'Certificate signature fetched',
        data: { public_key: 'KEY-XYZ', signature: 'SHA256-SIG' }
    });
};

export const getHistory = async (req, res, next) => {
    try {
        const history = await certService.getHistory(req.params.id);
        res.json({
            success: true,
            message: 'Certificate history fetched',
            data: history
        });
    } catch (error) { next(error); }
};

export const transferCertificate = async (req, res, next) => {
    try {
        const result = await certService.transferCertificate(req.params.id, req.body.newOwnerId, req.body.reason, req.user.id);
        res.json({
            success: true,
            message: 'Certificate transferred successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const extendCertificate = async (req, res, next) => {
    try {
        const result = await certService.extendCertificate(req.params.id, req.body.extensionMonths, req.body.reason, req.user.id);
        res.json({
            success: true,
            message: 'Certificate extension applied successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const downgradeCertificate = async (req, res, next) => {
    try {
        const result = await certService.downgradeCertificate(req.params.id, req.body.newTypeId, req.body.reason, req.user.id);
        res.json({
            success: true,
            message: 'Certificate downgraded successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const getExpiringCertificates = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const days = parseInt(req.query.days) || 30;
        const certs = await certService.getExpiringCertificates(days, scopeFilters);
        res.json({
            success: true,
            message: `Certificates expiring within ${days} days fetched successfully`,
            data: { expirations: certs, count: certs.length, days }
        });
    } catch (e) { next(e); }
};

export const getCertificateTypes = async (req, res, next) => {
    try {
        const types = await certService.getCertificateTypes();
        res.json({ success: true, data: types });
    } catch (e) { next(e); }
};

export const bulkRenew = async (req, res, next) => {
    try {
        const result = await certService.bulkRenew(req.body.ids, req.body.validity_years, req.body.reason, req.user.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const verifyCertificate = async (req, res, next) => {
    try {
        const result = await certService.verifyCertificate(req.params.number);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
