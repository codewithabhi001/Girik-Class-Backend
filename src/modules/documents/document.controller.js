import * as docService from './document.service.js';
import * as integrityService from '../../services/integrity.service.js';

export const uploadDocument = async (req, res, next) => {
    try {
        const doc = await docService.uploadDocument(req.file, req.body, req.user);
        res.status(201).json(doc);
    } catch (error) {
        next(error);
    }
};

export const getDocuments = async (req, res, next) => {
    try {
        const docs = await docService.getDocuments(req.params.entity, req.params.id);
        res.json(docs);
    } catch (error) {
        next(error);
    }
};

export const deleteDocument = async (req, res, next) => {
    try {
        await docService.deleteDocument(req.params.id);
        res.json({ message: 'Document deleted' });
    } catch (error) {
        next(error);
    }
};

export const lockEvidence = async (req, res, next) => {
    try {
        const result = await integrityService.lockEvidence(req.params.id, req.body.reason, req.user);
        res.json(result);
    } catch (error) { next(error); }
};

export const verifyIntegrity = async (req, res, next) => {
    try {
        const result = await integrityService.verifyIntegrity(req.params.id);
        res.json(result);
    } catch (error) { next(error); }
};

