/**
 * Certificate PDF job dispatch.
 * - PDF_QUEUE_URL set → enqueue to AWS SQS (Lambda worker processes later)
 * - PDF_QUEUE_URL unset → run on EC2 in background (non-blocking)
 *
 * Download flows use sync generation in certificate.service.js regardless.
 */

import logger from '../utils/logger.js';
import env from '../config/env.js';

const queueUrl = () => process.env.PDF_QUEUE_URL || env.aws?.pdfQueueUrl || null;

export const isPdfQueueEnabled = () => Boolean(queueUrl());

/**
 * Dispatch async PDF generation (create/issue/optional triggers).
 * @returns {'sqs'|'background'|'skipped'}
 */
export const dispatchCertificatePdfJob = async (certificateId, userId, trigger = 'manual') => {
    if (!certificateId) return 'skipped';

    const url = queueUrl();
    if (url) {
        try {
            const { SQSClient, SendMessageCommand } = await import('@aws-sdk/client-sqs');
            const client = new SQSClient({
                region: process.env.AWS_REGION || env.aws?.region || 'ap-southeast-2',
                credentials: env.aws?.accessKeyId
                    ? {
                          accessKeyId: env.aws.accessKeyId,
                          secretAccessKey: env.aws.secretAccessKey,
                      }
                    : undefined,
            });
            await client.send(
                new SendMessageCommand({
                    QueueUrl: url,
                    MessageBody: JSON.stringify({
                        certificateId,
                        userId: userId || null,
                        trigger,
                        requestedAt: new Date().toISOString(),
                    }),
                })
            );
            logger.info('[pdf-queue] Enqueued certificate PDF job to SQS', { certificateId, trigger });
            return 'sqs';
        } catch (err) {
            logger.error('[pdf-queue] SQS enqueue failed, falling back to EC2 background', {
                certificateId,
                trigger,
                message: err.message,
            });
        }
    }

    setImmediate(() => {
        runBackgroundPdfGeneration(certificateId, userId, trigger).catch((err) => {
            logger.error('[pdf-queue] Background EC2 PDF generation failed', {
                certificateId,
                trigger,
                message: err.message,
            });
        });
    });
    return 'background';
};

async function runBackgroundPdfGeneration(certificateId, userId, trigger) {
    const certService = await import('../modules/certificates/certificate.service.js');
    await certService.generateCertificatePdfById(certificateId, userId, trigger);
}
