
import * as evidenceService from './evidence.service.js';

export const getChain = async (req, res, next) => {
    try {
        const chain = await evidenceService.getChainOfCustody(req.params.id);
        res.json(chain);
    } catch (e) { next(e); }
};

export const verifyEvidence = async (req, res, next) => {
    try {
        const { document_id, hash } = req.body;
        const result = await evidenceService.verifyIntegrity(document_id, hash);
        res.json(result);
    } catch (e) { next(e); }
};

export const lockEvidence = async (req, res, next) => {
    try {
        const result = await evidenceService.lockEvidence(req.params.id, req.user.id, req.body.reason);
        res.json({ message: 'Evidence Locked', result });
    } catch (e) { next(e); }
};
