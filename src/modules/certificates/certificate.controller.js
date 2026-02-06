import * as certService from './certificate.service.js';

export const generateCertificate = async (req, res, next) => {
    try {
        const cert = await certService.generateCertificate(req.body, req.user);
        res.status(201).json(cert);
    } catch (error) {
        next(error);
    }
};

export const getCertificates = async (req, res, next) => {
    try {
        const certs = await certService.getCertificates(req.query);
        res.json(certs);
    } catch (error) {
        next(error);
    }
};

export const suspendCertificate = async (req, res, next) => {
    try {
        const result = await certService.updateStatus(req.params.id, 'SUSPENDED', req.body.reason, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const revokeCertificate = async (req, res, next) => {
    try {
        const result = await certService.updateStatus(req.params.id, 'REVOKED', req.body.reason, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const restoreCertificate = async (req, res, next) => {
    try {
        const result = await certService.updateStatus(req.params.id, 'VALID', req.body.reason, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const renewCertificate = async (req, res, next) => {
    try {
        const { validity_years, reason } = req.body;
        const result = await certService.renewCertificate(req.params.id, validity_years, reason, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export const reissueCertificate = async (req, res, next) => {
    try {
        const result = await certService.reissueCertificate(req.params.id, req.body.reason, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export const previewCertificate = async (req, res, next) => {
    try {
        const result = await certService.previewCertificate(req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export const signCertificate = async (req, res, next) => {
    // Stub
    res.json({ message: 'Certificate Signed', signature: 'SHA256-SIG' });
};

export const getSignature = async (req, res, next) => {
    res.json({ public_key: 'KEY-XYZ', signature: 'SHA256-SIG' });
};


export const getHistory = async (req, res, next) => {
    try {
        const history = await certService.getHistory(req.params.id);
        res.json(history);
    } catch (error) {
        next(error);
    }
};

export const transferCertificate = async (req, res, next) => {
    try {
        const result = await certService.transferCertificate(req.params.id, req.body.newOwnerId, req.body.reason, req.user);
        res.json(result);
    } catch (error) { next(error); }
};

export const extendCertificate = async (req, res, next) => {
    try {
        const result = await certService.extendCertificate(req.params.id, req.body.extensionMonths, req.body.reason, req.user);
        res.json(result);
    } catch (error) { next(error); }
};


export const downgradeCertificate = async (req, res, next) => {
    try {
        const result = await certService.downgradeCertificate(req.params.id, req.body.newTypeId, req.body.reason, req.user);
        res.json(result);
    } catch (error) { next(error); }
};

export const getExpiringCertificates = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const certs = await certService.getExpiringCertificates(days);
        res.json({ expirations: certs, count: certs.length, days });
    } catch (e) { next(e); }
};


