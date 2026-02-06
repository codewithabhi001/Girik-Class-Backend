
import db from '../../models/index.js';
import crypto from 'crypto';

const EvidenceLock = db.EvidenceLock;
const Document = db.Document;
// const AuditLog = db.EntityAuditTrail; // Assuming this exists or using generic Audit

export const getChainOfCustody = async (documentId) => {
    // 1. Fetch Document info
    const doc = await Document.findByPk(documentId);
    if (!doc) throw new Error('Document not found');

    // 2. Fetch Locks/Events
    const locks = await EvidenceLock.findAll({ where: { document_id: documentId } });

    // 3. Mock or Fetch S3 Access Logs (In production this queries CloudTrail or internal audit table)
    const history = [
        { action: 'UPLOADED', actor: doc.uploaded_by, timestamp: doc.created_at, hash: 'initial_hash' },
        ...locks.map(l => ({ action: 'LOCKED', actor: l.locked_by, timestamp: l.locked_at, reason: l.reason }))
    ];

    return {
        document_id: documentId,
        current_hash: 'sha256-mock-hash-from-s3', // In real impl, verify S3 object
        chain: history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    };
};

export const verifyIntegrity = async (documentId, providedHash) => {
    // Mock S3 fetch and hash calc
    const s3Hash = 'sha256-mock-hash-from-s3'; // await s3Service.getObjectHash(doc.key)

    return {
        valid: s3Hash === providedHash,
        s3_hash: s3Hash,
        timestamp: new Date()
    };
};

export const lockEvidence = async (documentId, userId, reason) => {
    // Check if already locked
    const existing = await EvidenceLock.findOne({ where: { document_id: documentId } });
    if (existing) throw new Error('Evidence already locked');

    // Calculate Hash before locking
    const integrityHash = 'sha256-mock-hash-from-s3';

    const lock = await EvidenceLock.create({
        document_id: documentId,
        locked_by: userId,
        reason: reason,
        integrity_hash: integrityHash
    });

    // Send Event
    console.log(`EVENT_EVIDENCE_LOCKED: Doc ${documentId} by User ${userId}`);

    return lock;
};
