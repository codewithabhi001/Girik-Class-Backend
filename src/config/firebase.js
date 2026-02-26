import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import config from './env.js';
import logger from '../utils/logger.js';

let firebaseApp;

try {
    const fullPath = resolve(config.firebase.serviceAccountPath);
    console.log('Attempting to load Firebase service account from:', fullPath);
    const serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'));

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK initialized successfully');
    logger.info('Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    logger.error('Failed to initialize Firebase Admin SDK:', error);
}

export default firebaseApp;
