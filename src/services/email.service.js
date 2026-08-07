import { mailTransporter, SENDER_MAP } from '../config/emailConfig.js';
import { renderEmailTemplate } from '../email-templates/index.js';
import { buildTransactionalNotificationEmail } from '../email-templates/notification-html.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validates the email parameters
 * @param {string | string[]} to 
 * @param {string} subject 
 * @param {string} body 
 */
const validateEmailParams = (to, subject, body) => {
    const recipients = Array.isArray(to) ? to : [to];
    const validRecipients = recipients.filter(email => email && typeof email === 'string' && email.trim() !== '');

    if (validRecipients.length === 0) throw new Error('Recipient list cannot be empty.');
    if (!subject || subject.trim() === '') throw new Error('Subject cannot be empty.');
    if (!body || body.trim() === '') throw new Error('Email body cannot be empty.');

    return validRecipients;
};

/**
 * Retries a function multiple times on failure.
 * @param {Function} operation 
 * @param {number} retries 
 */
const withRetry = async (operation, retries = 2) => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < retries) {
                logger.info(`[EmailService] SES send failed. Retry attempt ${attempt + 1}/${retries}...`);
            }
        }
    }
    throw lastError;
};

/**
 * Main function to send transactional emails via AWS SES (using Nodemailer transport)
 * 
 * @param {string | string[]} to - Recipient(s)
 * @param {string} subject - Email subject
 * @param {string} body - Email HTML/Text body
 * @param {'alert' | 'notification' | 'system' | 'subscribe'} type - Module type for sender selection
 * @param {{ headers?: Record<string, string>, attachments?: any[] }} [options] - Extra RFC headers or attachments
 * @returns {Promise<boolean>}
 */
export const sendEmail = async (to, subject, body, type = 'system', options = {}) => {
    try {
        const recipients = validateEmailParams(to, subject, body);
        const fromEmail = SENDER_MAP[type] || SENDER_MAP.system;

        const baseOptions = {
            from: fromEmail,
            subject: subject,
            html: body
        };

        const extra = options.headers;
        if (extra && typeof extra === 'object' && Object.keys(extra).length > 0) {
            baseOptions.headers = { ...extra };
        }

        if (options.attachments && Array.isArray(options.attachments)) {
            baseOptions.attachments = options.attachments;
        }

        // Auto-attach inline PNG assets used by email layout (CID — Gmail-safe)
        baseOptions.attachments = baseOptions.attachments || [];
        const inlineAssets = [
            { cid: 'grclass-logo', file: 'grclass-logo.png' },
            { cid: 'grclass-qr', file: 'grclass-verify-qr.png' },
            { cid: 'icon-location', file: 'icons/location.png' },
            { cid: 'icon-phone', file: 'icons/phone.png' },
            { cid: 'icon-email', file: 'icons/email.png' },
            { cid: 'icon-web', file: 'icons/web.png' }
        ];
        for (const asset of inlineAssets) {
            if (!body.includes(`cid:${asset.cid}`)) continue;
            baseOptions.attachments.push({
                filename: path.basename(asset.file),
                path: path.join(__dirname, '../email-templates', asset.file),
                cid: asset.cid,
                contentDisposition: 'inline',
                contentType: 'image/png'
            });
        }

        // Send individual emails to each recipient so they don't see each other
        const sendPromises = recipients.map(async (recipient) => {
            const mailOptions = { ...baseOptions, to: recipient };
            return await withRetry(() => mailTransporter.sendMail(mailOptions), 2);
        });

        const results = await Promise.allSettled(sendPromises);
        const successes = results.filter(r => r.status === 'fulfilled').length;

        logger.info(`[EmailService] Dispatched ${successes}/${recipients.length} individual emails from ${fromEmail}. Subject: ${subject}`);
        return successes > 0;
    } catch (error) {
        logger.error(`[EmailService] Error sending email: ${error.message}`, {
            to, subject, type, error: error.stack
        });
        return false;
    }
};

/**
 * Handles legacy template-based emails but sends via SES API
 * 
 * @param {string} to 
 * @param {string} templateName 
 * @param {Object} data 
 * @returns {Promise<boolean>}
 */
export const sendTemplateEmail = async (to, templateName, data) => {
    const rendered = renderEmailTemplate(templateName, data);
    if (rendered) {
        return await sendEmail(to, rendered.subject, rendered.html, rendered.type);
    }

    let fallbackSubject = '';
    let fallbackBody = '';
    let type = 'notification';

    switch (templateName) {
        case 'SURVEYOR_APPLICATION_SUBMITTED':
            fallbackSubject = `Application Received: Surveyor Registration — ${data.fullName}`;
            fallbackBody = `Dear ${data.fullName},\n\nThank you for applying to join GR Class as an authorized surveyor. We have successfully received your application.\n\nOur team is currently reviewing your profile and credentials (including your uploaded CV, ID Proof, and Certificates). We will get back to you with an update or request for additional documents shortly.\n\nBest regards,\nGR Class Team`;
            break;
        case 'SLA_BREACH':
            fallbackSubject = `URGENT: SLA breach — Job ${data.jobId}`;
            fallbackBody = `A service-level breach was detected for job ${data.jobId}. Rule: ${data.rule}. Time: ${data.time}`;
            type = 'alerts';
            break;
        case 'CERTIFICATE_EXPIRY':
            fallbackSubject = `Renewal Notice: Your Certificate for ${data.vesselName} is Expiring Soon`;
            fallbackBody = `This is a reminder that the following certificate is approaching its expiry date. \n\nVessel: ${data.vesselName}\nCertificate: ${data.certificateNumber}\nType: ${data.certificateType}\nExpiry Date: ${data.expiryDate}\n\nPlease initiate the renewal process soon to avoid any operational interruptions.`;
            break;
        case 'LEGAL_HOLD':
            fallbackSubject = `Legal hold: ${data.entityId}`;
            fallbackBody = `A legal hold has been placed on ${data.type} ID ${data.entityId} by ${data.actor}.`;
            type = 'alerts';
            break;
        case 'JOB_CREATED':
            fallbackSubject = `New job request: ${data.vesselName}`;
            fallbackBody = `A new job request was created for vessel ${data.vesselName} at ${data.port}.`;
            break;
        case 'JOB_ASSIGNED':
            fallbackSubject = `New assignment: ${data.vesselName}`;
            fallbackBody = `You have been assigned to survey ${data.vesselName} at ${data.port}. Sign in to the GR Class app to view details.`;
            break;
        case 'JOB_APPROVED':
            fallbackSubject = data.vesselName ? `Job update: ${data.vesselName}` : 'Job status update';
            fallbackBody = data.jobId && data.status
                ? `Job ${data.jobId} status is now ${data.status}. You may proceed in the app.`
                : `Your job request has been updated.`;
            break;
        case 'JOB_SENT_BACK':
            fallbackSubject = `Action required: Job ${data.jobId}`;
            fallbackBody = `Your survey report for ${data.vesselName} was sent back for changes. Remarks: ${data.remarks}`;
            break;
        case 'JOB_FINALIZED':
            fallbackSubject = `Job finalized: ${data.vesselName}`;
            fallbackBody = `The survey for ${data.vesselName} has been finalized.`;
            break;
        case 'JOB_DOCUMENT_VERIFIED':
            fallbackSubject = `Documents verified: ${data.vesselName}`;
            fallbackBody = `The Technical Officer has verified documents for the job on ${data.vesselName}.`;
            break;
        case 'JOB_REVIEWED':
            fallbackSubject = `Technical review: ${data.vesselName}`;
            fallbackBody = `Technical review for ${data.vesselName} has been completed.`;
            break;
        case 'SURVEY_STARTED':
            fallbackSubject = `Survey in progress: ${data.vesselName}`;
            fallbackBody = `Surveyor ${data.surveyorName} has started the inspection on ${data.vesselName}.`;
            break;
        case 'SURVEY_PROOF_UPLOADED':
            fallbackSubject = `Evidence uploaded: ${data.vesselName}`;
            fallbackBody = `Evidence proof has been uploaded for the survey on ${data.vesselName}.`;
            break;
        case 'SURVEY_SUBMITTED':
            fallbackSubject = `Survey report submitted: ${data.vesselName}`;
            fallbackBody = `The final survey report for ${data.vesselName} has been submitted and is ready for review.`;
            break;
        case 'SURVEY_REWORK_REQUESTED':
            fallbackSubject = `Rework requested: ${data.vesselName}`;
            fallbackBody = `A rework has been requested for the survey report on ${data.vesselName}. Reason: ${data.reason}`;
            break;
        case 'JOB_RESCHEDULED':
            fallbackSubject = `Job rescheduled: ${data.vesselName}`;
            fallbackBody = `The job for ${data.vesselName} has been rescheduled to ${data.newDate} at ${data.newPort}. Reason: ${data.reason}`;
            break;
        case 'CERTIFICATE_GENERATED':
            if (data.isInternal) {
                fallbackSubject = `Internal: Certificate Issued — ${data.certificateNumber}`;
                fallbackBody = `A new certificate ${data.certificateNumber} has been issued for ${data.vesselName} (${data.certificateType}) following the completion of Job ${data.jobId}. This is now available in the system for oversight.`;
            } else {
                fallbackSubject = `Congratulations! Certificate Issued — ${data.certificateNumber}`;
                fallbackBody = `We are pleased to inform you that the certificate for your vessel ${data.vesselName} has been successfully generated. \n\nCertificate Number: ${data.certificateNumber}\nType: ${data.certificateType}\n\nYou can now view and download the official PDF from your dashboard.`;
            }
            break;
        default:
            fallbackSubject = data.title || 'GR Class notification';
            fallbackBody = data.message || (typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data));
    }

    const { subject, html } = buildTransactionalNotificationEmail({
        templateName,
        data: data || {},
        fallbackSubject,
        fallbackBody
    });

    return await sendEmail(to, subject, html, type);
};

export default {
    sendEmail,
    sendTemplateEmail
};
