import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as websocketService from '../../services/websocket.service.js';

const Message = db.Message;
const User = db.User;

export const getJobMessages = async (jobId, isInternal = false) => {
    const messages = await Message.findAll({
        where: { job_id: jobId, is_internal: isInternal },
        attributes: ['id', 'job_id', 'sender_id', 'message_text', 'is_internal', 'attachment_url', 'created_at', 'updated_at'],
        include: [{ model: User, as: 'Sender', attributes: ['name', 'role'] }],
        order: [['created_at', 'ASC']]
    });

    let plainMessages = messages.map(m => (typeof m.get === 'function' ? m.get({ plain: true }) : m));

    if (isInternal) {
        const notes = await db.JobNote.findAll({
            where: { job_id: jobId },
            include: [{ model: User, attributes: ['name', 'role'] }]
        });
        const notesAsMessages = notes.map(n => {
            const plainN = typeof n.get === 'function' ? n.get({ plain: true }) : n;
            return {
                id: plainN.id,
                job_id: plainN.job_id,
                sender_id: plainN.user_id,
                message_text: plainN.note_text,
                is_internal: true,
                attachment_url: null,
                created_at: plainN.created_at || plainN.createdAt,
                updated_at: plainN.updated_at || plainN.updatedAt,
                Sender: plainN.User ? { name: plainN.User.name, role: plainN.User.role } : { name: 'Staff', role: 'STAFF' }
            };
        });

        const existingTexts = new Set(plainMessages.map(m => m.message_text));
        const uniqueNotes = notesAsMessages.filter(n => !existingTexts.has(n.message_text));

        const combined = [...plainMessages, ...uniqueNotes];
        combined.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        return await fileAccessService.resolveEntity(combined);
    }

    return await fileAccessService.resolveEntity(plainMessages);
};

export const sendMessage = async (jobId, senderId, data = {}) => {
    let attachmentUrl = data?.attachment_url || data?.attachmentKey || null;

    const message = await Message.create({
        job_id: jobId,
        sender_id: senderId,
        message_text: data?.message_text,
        is_internal: data?.is_internal || false,
        attachment_url: attachmentUrl
    });

    const fullMessage = await Message.findByPk(message.id, {
        include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'role'] }]
    });

    const resolved = await fileAccessService.resolveEntity(fullMessage, { id: senderId });

    // Broadcast message to the correct job room (internal/external segregation)
    try {
        const roomName = resolved.is_internal ? `job:${jobId}:internal` : `job:${jobId}:external`;
        websocketService.emitToRoom(roomName, 'message:received', resolved);
    } catch (wsErr) {
        // Non-blocking fallback
        console.error('[WebSocket] Broadcast message failed:', wsErr);
    }

    return resolved;
};

export const getUnreadCount = async (userId) => {
    return { unread_count: 0 };
};
