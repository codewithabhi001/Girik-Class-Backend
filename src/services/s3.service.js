import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/aws.js';
import env from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload file to S3 with optional folder prefix.
 * @param {Buffer} fileBuffer - File content
 * @param {string} fileName - Original filename
 * @param {string} mimeType - MIME type
 * @param {string} [folder] - Folder prefix (e.g. 'certificates', 'surveyor', 'documents/job')
 */
export const uploadFile = async (fileBuffer, fileName, mimeType, folder = '') => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        if (env.nodeEnv === 'production') throw new Error('FATAL: AWS credentials not configured in production environment.');
        console.warn('AWS Credentials missing, returning mock URL');
        const path = folder ? `${folder}/${fileName}` : fileName;
        return `https://mock-s3.com/${path}`;
    }

    const prefix = folder ? folder.replace(/\/$/, '') + '/' : '';
    const key = `${prefix}${uuidv4()}-${fileName}`;
    const command = new PutObjectCommand({
        Bucket: env.aws.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);
    // Return only the key as requested, not the full URL.
    return key;
};

/** Folder constants for organized uploads */
export const UPLOAD_FOLDERS = {
    SURVEYOR: 'surveyor',
    DOCUMENTS: 'documents',
    SURVEYS: 'surveys',
    SURVEYS_PROOF: 'surveys/proofs',
    SURVEYS_PHOTO: 'surveys/photos',
    JOBS_ATTACHMENTS: 'jobs/attachments',
    CERTIFICATES: 'certificates',
    PUBLIC_CERTIFICATES: 'public/certificates', // Publicly accessible via CDN
    WEBSITE_VIDEOS: 'public/website/videos',
};

export const getSignedFileUrl = async (key, expiresIn = 3600) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        if (env.nodeEnv === 'production') throw new Error('FATAL: AWS credentials not configured in production environment.');
        return `https://mock-s3.com/${key}`;
    }
    const command = new GetObjectCommand({
        Bucket: env.aws.bucketName,
        Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
};

export const getFileContent = async (key) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        if (env.nodeEnv === 'production') throw new Error('FATAL: AWS credentials not configured in production environment.');
        return Buffer.from("Mock Content for Integrity Check");
    }
    const command = new GetObjectCommand({
        Bucket: env.aws.bucketName,
        Key: key,
    });
    const response = await s3Client.send(command);
    // Convert stream to buffer
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
};

