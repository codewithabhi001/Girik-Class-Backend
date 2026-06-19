import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/aws.js';
import env from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique S3 key
 */
export const generateKey = (fileName, folder = '') => {
    const prefix = folder ? folder.replace(/\/$/, '') + '/' : '';
    return `${prefix}${uuidv4()}-${fileName}`;
};

/**
 * Upload file to S3 with optional folder prefix.
 * @param {Buffer} fileBuffer - File content
 * @param {string} fileName - Original filename
 * @param {string} mimeType - MIME type
 * @param {string} [folder] - Folder prefix (e.g. 'certificates', 'surveyor', 'documents/job')
 * @param {string} [providedKey] - Optional pre-generated key
 */
export const uploadFile = async (fileBuffer, fileName, mimeType, folder = '', providedKey = null) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        if (env.nodeEnv === 'production') throw new Error('FATAL: AWS credentials not configured in production environment.');
        console.warn('AWS Credentials missing, returning mock URL');
        const path = providedKey || (folder ? `${folder}/${fileName}` : fileName);
        return path;
    }

    const key = providedKey || generateKey(fileName, folder);
    const command = new PutObjectCommand({
        Bucket: env.aws.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);
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

export const getSignedFileUrl = async (key, expiresIn = 3600, options = {}) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        if (env.nodeEnv === 'production') throw new Error('FATAL: AWS credentials not configured in production environment.');
        return `https://mock-s3.com/${key}`;
    }
    const commandParams = {
        Bucket: env.aws.bucketName,
        Key: key,
    };
    if (options.ResponseContentDisposition) {
        commandParams.ResponseContentDisposition = options.ResponseContentDisposition;
    }
    const command = new GetObjectCommand(commandParams);
    return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Generate a signed URL for uploading a file directly to S3.
 * @param {string} key - The S3 key (path) where the file will be stored.
 * @param {string} contentType - The MIME type of the file (e.g., 'image/jpeg').
 * @param {number} [expiresIn=3600] - URL expiration time in seconds.
 */
export const getUploadSignedUrl = async (key, contentType, expiresIn = 3600) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        if (env.nodeEnv === 'production') throw new Error('FATAL: AWS credentials not configured.');
        return `https://mock-s3.com/upload/${key}`;
    }

    const command = new PutObjectCommand({
        Bucket: env.aws.bucketName,
        Key: key,
        ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
};

const cleanKey = (urlOrKey) => {
    if (!urlOrKey) return null;
    try {
        const url = new URL(urlOrKey);
        return decodeURIComponent(url.pathname.substring(1));
    } catch (e) {
        return decodeURIComponent(urlOrKey);
    }
};

export const getFileContent = async (keyOrUrl) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        if (env.nodeEnv === 'production') throw new Error('FATAL: AWS credentials not configured in production environment.');
        return Buffer.from("Mock Content for Integrity Check");
    }
    const key = cleanKey(keyOrUrl);
    const command = new GetObjectCommand({
        Bucket: env.aws.bucketName,
        Key: key,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
        const response = await s3Client.send(command, { abortSignal: controller.signal });
        clearTimeout(timeoutId);
        // Convert stream to buffer
        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray);
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
};

