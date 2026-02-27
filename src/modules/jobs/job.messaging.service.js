import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';

const Message = db.Message;
const User = db.User;

export const getJobMessages = async (jobId, isInternal = false) => {
    const messages = await Message.findAll({
        where: { job_id: jobId, is_internal: isInternal },
        include: [{ model: User, as: 'Sender', attributes: ['name', 'role'] }],
        order: [['created_at', 'ASC']]
    });
    return await fileAccessService.resolveEntity(messages);
};

export const sendMessage = async (jobId, senderId, data, file) => {
    let attachmentUrl = data.attachmentKey || null;
    if (file) {
        attachmentUrl = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, s3Service.UPLOAD_FOLDERS.JOBS_ATTACHMENTS);
    }

    const message = await Message.create({
        job_id: jobId,
        sender_id: senderId,
        message_text: data.message_text,
        is_internal: data.is_internal || false,
        attachment_url: attachmentUrl
    });

    return await fileAccessService.resolveEntity(message, { id: senderId });
};

export const getUnreadCount = async (userId) => {
    return { unread_count: 0 };
};
