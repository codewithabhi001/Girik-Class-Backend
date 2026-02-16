import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';

const Document = db.Document;

export const getEntityDocuments = async (entityType, entityId) => {
    return await Document.findAll({
        where: { entity_type: entityType, entity_id: entityId },
        order: [['uploaded_at', 'DESC']]
    });
};

export const uploadEntityDocument = async (entityType, entityId, file, userId, documentType, description) => {
    const folder = `${s3Service.UPLOAD_FOLDERS.DOCUMENTS}/${String(entityType).toLowerCase()}`;
    const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, folder);

    return await Document.create({
        entity_type: entityType,
        entity_id: entityId,
        file_url: url,
        file_type: file.mimetype,
        document_type: documentType,
        description: description,
        uploaded_by: userId
    });
};

export const registerDocument = async (entityType, entityId, fileData, userId, documentType, description) => {
    return await Document.create({
        entity_type: entityType,
        entity_id: entityId,
        file_url: fileData.url,
        file_type: fileData.type,
        document_type: documentType,
        description: description,
        uploaded_by: userId
    });
};

export const deleteDocument = async (id) => {
    const doc = await Document.findByPk(id);
    if (!doc) throw { statusCode: 404, message: 'Document not found' };
    return await doc.destroy();
};
