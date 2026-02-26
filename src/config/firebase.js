import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import config from './env.js';
import logger from '../utils/logger.js';

let firebaseApp;

try {
    const serviceAccountPath = resolve(config.firebase.serviceAccountPath);
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    logger.info('Firebase Admin SDK initialized successfully');
} catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
}

export default firebaseApp;
