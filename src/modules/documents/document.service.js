import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';

const Document = db.Document;
const DocumentVersion = db.DocumentVersion;

export const uploadDocument = async (file, data, user) => {
    // data: entity_type, entity_id, document_type, description
    const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype);

    // Create Document Logic: Check if exists? Or create new?
    // Let's assume create new Document for now or add version if same type/entity exists??
    // Requirement says: "Each upload is versioned".

    // Check if document of this type for this entity exists
    let document = await Document.findOne({
        where: {
            entity_type: data.entity_type,
            entity_id: data.entity_id,
            document_type: data.document_type
        }
    });

    if (!document) {
        document = await Document.create({
            entity_type: data.entity_type,
            entity_id: data.entity_id,
            document_type: data.document_type,
            file_name: file.originalname,
            file_url: url, // Active version URL
            uploaded_by_user_id: user.id
        });
    } else {
        await document.update({
            file_name: file.originalname,
            file_url: url,
            uploaded_by_user_id: user.id,
            version: document.version + 1
        });
    }

    // Add History
    await DocumentVersion.create({
        document_id: document.id,
        version: document.version,
        file_url: url,
        uploaded_by_user_id: user.id,
        change_reason: data.description || 'New Version'
    });

    return document;
};

export const getDocuments = async (entityType, entityId) => {
    return await Document.findAll({
        where: { entity_type: entityType, entity_id: entityId }
    });
};

export const deleteDocument = async (id) => {
    return await Document.destroy({ where: { id } });
};
