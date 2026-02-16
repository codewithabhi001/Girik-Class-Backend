
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const sendEmail = async (to, subject, text, html) => {
    try {
        if (!process.env.SMTP_HOST) {
            logger.warn('SMTP_HOST not configured. Email not sent:', { to, subject });
            return false;
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"GIRIK System" <no-reply@girik.com>',
            to,
            subject,
            text,
            html
        });

        logger.info('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        logger.error('Error sending email:', error);
        return false;
    }
};

export const sendTemplateEmail = async (to, templateName, data) => {
    // Placeholder for template engine logic (e.g. EJS or Handlebars)
    // For now, construct simple strings based on templateName
    let subject = '';
    let text = '';

    switch (templateName) {
        case 'SLA_BREACH':
            subject = `URGENT: SLA Breach Detected - Job ${data.jobId}`;
            text = `A breach was detected for Job ${data.jobId}. Rule: ${data.rule}. Time: ${data.time}`;
            break;
        case 'CERTIFICATE_EXPIRY':
            subject = `Certificate Expiring: ${data.certificateNumber}`;
            text = `Certificate ${data.certificateNumber} for ${data.vesselName} is expiring on ${data.expiryDate}.`;
            break;
        case 'LEGAL_HOLD':
            subject = `Legal Hold Activated: ${data.entityId}`;
            text = `A Legal Hold has been placed on ${data.type} ID ${data.entityId} by ${data.actor}.`;
            break;
        case 'JOB_CREATED':
            subject = `New Job Request: ${data.vesselName}`;
            text = `A new job request has been created for vessel ${data.vesselName} at ${data.port}.`;
            break;
        case 'JOB_ASSIGNED':
            subject = `New Assignment: ${data.vesselName}`;
            text = `You have been assigned to survey ${data.vesselName} at ${data.port}. Log in to view details.`;
            break;
        case 'JOB_APPROVED':
            subject = `Job Approved: ${data.vesselName}`;
            text = `Job ${data.jobId} status has been updated to ${data.status}. You may now proceed.`;
            break;
        case 'JOB_SENT_BACK':
            subject = `Action Required: Job ${data.jobId} Sent Back`;
            text = `Your survey report for ${data.vesselName} was sent back. Remarks: ${data.remarks}`;
            break;
        case 'JOB_FINALIZED':
            subject = `Job Finalized: ${data.vesselName}`;
            text = `The survey for ${data.vesselName} has been finalized.`;
            break;
        default:
            subject = 'Notification from GIRIK';
            text = JSON.stringify(data, null, 2);
    }

    return await sendEmail(to, subject, text);
};
