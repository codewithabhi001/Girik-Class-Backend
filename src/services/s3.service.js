import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/aws.js';
import env from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (fileBuffer, fileName, mimeType) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        console.warn('AWS Credentials missing, returning mock URL');
        return `https://mock-s3.com/${fileName}`;
    }

    const key = `${uuidv4()}-${fileName}`;
    const command = new PutObjectCommand({
        Bucket: env.aws.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);
    return `https://${env.aws.bucketName}.s3.${env.aws.region}.amazonaws.com/${key}`;
};

export const getSignedFileUrl = async (key) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
        return `https://mock-s3.com/${key}`;
    }
    const command = new GetObjectCommand({
        Bucket: env.aws.bucketName,
        Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const getFileContent = async (key) => {
    if (!env.aws.bucketName || !env.aws.accessKeyId) {
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

