
import db from '../../models/index.js';
const AuditLog = db.AuditLog;
const EntityAuditTrail = db.EntityAuditTrail;

export const logAction = async (userId, action, entityName, entityId, ipAddress) => {
    try {
        await AuditLog.create({
            user_id: userId,
            action: action,
            entity_name: entityName || 'API',
            entity_id: entityId || null,
            ip_address: ipAddress,
            created_at: new Date()
        });
    } catch (error) {
        console.error('Audit Log failed:', error);
        // Do not block main flow if audit fails
    }
};

export const getLogs = async (query) => {
    // Basic filter
    return await AuditLog.findAll({ limit: 50, order: [['created_at', 'DESC']] });
};

export const getEntityHistory = async () => {
    return await EntityAuditTrail.findAll({ limit: 50, order: [['changed_at', 'DESC']] });
};
