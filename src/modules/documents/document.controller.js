import * as documentService from './document.service.js';
import db from '../../models/index.js';

const verifyAccess = async (user, entityType, entityId) => {
    if (user.role === 'CLIENT') {
        if (entityType === 'VESSEL') {
            const vessel = await db.Vessel.findOne({ where: { id: entityId, client_id: user.client_id } });
            if (!vessel) throw { statusCode: 403, message: 'Unauthorized access to vessel documents' };
        } else if (entityType === 'JOB') {
            const job = await db.JobRequest.findByPk(entityId, { include: [{ model: db.Vessel, attributes: ['client_id'] }] });
            if (!job || job.Vessel.client_id !== user.client_id) throw { statusCode: 403, message: 'Unauthorized access to job documents' };
        } else if (entityType === 'CERTIFICATE') {
            const cert = await db.Certificate.findByPk(entityId, { include: [{ model: db.Vessel, attributes: ['client_id'] }] });
            if (!cert || cert.Vessel.client_id !== user.client_id) throw { statusCode: 403, message: 'Unauthorized access to certificate documents' };
        }
    }
    // Other roles checks? Assuming internal roles have access. TO/Surveyor might be restricted too.
    // For now mirroring Client Portal logic which was strict.
};

export const getDocuments = async (req, res, next) => {
    try {
        const { entityId } = req.params;
        const entityType = req.params.entityType.toUpperCase();
        await verifyAccess(req.user, entityType, entityId);
        const result = await documentService.getEntityDocuments(entityType, entityId);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const uploadDocument = async (req, res, next) => {
    try {
        const { entityId } = req.params;
        const entityType = req.params.entityType.toUpperCase();
        await verifyAccess(req.user, entityType, entityId);
        const { document_type, description } = req.body;
        let result;
        if (req.file) {
            result = await documentService.uploadEntityDocument(entityType, entityId, req.file, req.user.id, document_type, description);
        } else if (req.body.fileData) {
            result = await documentService.registerDocument(entityType, entityId, req.body.fileData, req.user.id, document_type, description);
        } else {
            throw { statusCode: 400, message: 'No file or file data provided' };
        }
        res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const deleteDocument = async (req, res, next) => {
    try {
        // Only Admin/GM/TM can delete? Route middleware handles this usually.
        // But if Client can delete their own upload?
        // Client portal didn't have delete.
        await documentService.deleteDocument(req.params.id);
        res.status(200).json({ success: true, message: 'Document deleted' });
    } catch (e) { next(e); }
};
