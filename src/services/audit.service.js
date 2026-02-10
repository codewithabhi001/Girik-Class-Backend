import db from '../models/index.js';

const AuditLog = db.AuditLog;

export const logAction = async (data) => {
    try {
        await AuditLog.create({
            user_id: data.user_id,
            action: data.action,
            entity_name: data.entity_name,
            entity_id: data.entity_id,
            old_values: data.old_values,
            new_values: data.new_values,
            ip_address: data.ip_address,
            user_agent: data.user_agent
        });
    } catch (error) {
        console.error('Failed to log audit action:', error);
        // Don't throw to avoid breaking the main operation
    }
};
