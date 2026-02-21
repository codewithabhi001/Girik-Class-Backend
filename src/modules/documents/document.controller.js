import * as documentService from './document.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import db from '../../models/index.js';



export const getDocuments = async (req, res, next) => {
    try {
        const { entityId } = req.params;
        const entityType = req.params.entityType.toUpperCase();

        const hasAccess = await fileAccessService.validateUserEntityAccess(req.user, entityType, entityId);
        if (!hasAccess) {
            throw { statusCode: 403, message: `Unauthorized access to ${entityType.toLowerCase()} documents` };
        }

        const documents = await documentService.getEntityDocuments(entityType, entityId);

        // Transform documents to structured response
        const data = await Promise.all(documents.map(async (doc) => {
            const accessInfo = await fileAccessService.processFileAccess(doc, req.user);
            return {
                ...doc.toJSON(),
                ...accessInfo,
                // Hide raw S3 URL if desired, though key is public/certificates sometimes
                file_url: undefined // Hide raw URL
            };
        }));

        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const uploadDocument = async (req, res, next) => {
    try {
        const { entityId } = req.params;
        const entityType = req.params.entityType.toUpperCase();

        const hasAccess = await fileAccessService.validateUserEntityAccess(req.user, entityType, entityId);
        if (!hasAccess) {
            throw { statusCode: 403, message: `Unauthorized access to ${entityType.toLowerCase()} documents` };
        }

        const { document_type, description } = req.body;

        let results = [];

        if (req.files && req.files.length > 0) {
            // Upload multiple files
            const uploadPromises = req.files.map(file =>
                documentService.uploadEntityDocument(entityType, entityId, file, req.user.id, document_type, description)
            );
            results = await Promise.all(uploadPromises);
        } else if (req.file) {
            // Fallback for single file
            const result = await documentService.uploadEntityDocument(entityType, entityId, req.file, req.user.id, document_type, description);
            results.push(result);
        } else if (req.body.fileData) {
            // Register external file data
            const result = await documentService.registerDocument(entityType, entityId, req.body.fileData, req.user.id, document_type, description);
            results.push(result);
        } else {
            throw { statusCode: 400, message: 'No files provided' };
        }

        const data = await Promise.all(results.map(async (doc) => {
            const accessInfo = await fileAccessService.processFileAccess(doc, req.user);
            return {
                ...doc.toJSON(),
                ...accessInfo,
                file_url: undefined
            };
        }));

        res.status(201).json({ success: true, count: data.length, data: data });
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

export const uploadStandaloneFile = async (req, res, next) => {
    try {
        if (!req.file) {
            throw { statusCode: 400, message: 'No file provided' };
        }
        const folderName = req.body.folder || 'misc';
        const result = await documentService.uploadStandaloneFile(req.file, folderName);
        res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
};
