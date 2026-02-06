
import crypto from 'crypto';
import db from '../models/index.js';
import * as s3Service from './s3.service.js';

/**
 * Lock a document for evidence, ensuring its content cannot change without detection.
 */
export const lockEvidence = async (documentId, reason, user) => {
    const doc = await db.Document.findByPk(documentId);
    if (!doc) throw { statusCode: 404, message: 'Document not found' };

    // Check if already locked? 
    // Usually we allow re-locking if it's explicitly done, or we block it.
    // For now, allow creating a new lock entry (audit trail).

    // Extract Key from URL
    // robust parsing needed if URL structure changes
    const key = doc.file_url.split('/').pop();

    const buffer = await s3Service.getFileContent(key);

    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const hex = hashSum.digest('hex');

    const lock = await db.EvidenceLock.create({
        document_id: doc.id,
        locked_by: user.id,
        reason,
        integrity_hash: hex,
        locked_at: new Date()
    });

    return lock;
};

/**
 * Verify if the document content matches the locked hash.
 */
export const verifyIntegrity = async (documentId) => {
    const doc = await db.Document.findByPk(documentId);
    if (!doc) throw { statusCode: 404, message: 'Document not found' };

    const lock = await db.EvidenceLock.findOne({
        where: { document_id: documentId },
        order: [['locked_at', 'DESC']]
    });

    if (!lock) {
        return {
            status: 'UNLOCKED',
            message: 'No evidence lock found for this document.'
        };
    }

    const key = doc.file_url.split('/').pop();
    const buffer = await s3Service.getFileContent(key);

    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const currentHash = hashSum.digest('hex');

    if (currentHash === lock.integrity_hash) {
        return {
            status: 'VERIFIED',
            message: 'Integrity confirmed. Content matches the locked version.'
        };
    } else {
        return {
            status: 'TAMPERED',
            message: 'CRITICAL: Hash mismatch. File content has been modified since locking.',
            details: {
                original_hash: lock.integrity_hash,
                current_hash: currentHash,
                locked_at: lock.locked_at,
                locked_by: lock.locked_by
            }
        };
    }
};
