import dotenv from 'dotenv';
dotenv.config();

export default {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    serverHost: process.env.SERVER_HOST || process.env.SERVER_IP || null,
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        name: process.env.DB_NAME || 'gr_class_db',
        dialect: process.env.DB_DIALECT || 'mysql',
        sslCa: process.env.DB_SSL_CA,
        replicaHost: process.env.DB_REPLICA_HOST || null,
        replicaUsername: process.env.DB_REPLICA_USER || process.env.DB_USER || 'root',
        replicaPassword: process.env.DB_REPLICA_PASS || process.env.DB_PASS || '',
    },
    jwt: {
        get accessSecret() {
            const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access_secret';
            if (process.env.NODE_ENV === 'production' && (!secret || secret === 'access_secret' || secret === 'secret')) {
                throw new Error('JWT_ACCESS_SECRET must be set to a strong value in production');
            }
            return secret;
        },
        get refreshSecret() {
            const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh_secret';
            if (process.env.NODE_ENV === 'production' && (!secret || secret === 'refresh_secret' || secret === 'secret')) {
                throw new Error('JWT_REFRESH_SECRET must be set to a strong value in production');
            }
            return secret;
        },
        get resetSecret() {
            const secret = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET || 'reset_secret';
            if (process.env.NODE_ENV === 'production' && (!secret || secret === 'reset_secret' || secret === 'secret')) {
                throw new Error('JWT_RESET_SECRET must be set to a strong value in production');
            }
            return secret;
        },
        /** Access token: short-lived, used for API auth (Bearer or cookie). */
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        /** Refresh token: long-lived, used only to get new access token. */
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        /** Legacy: single-token expiry (used if you don’t use access/refresh split). */
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        bucketName: process.env.AWS_BUCKET_NAME,
        cloudfrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
        ses: {
            accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
            region: process.env.AWS_SES_REGION || process.env.AWS_REGION,
        }
    },
    frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
    /**
     * Public base URL of this API (no trailing slash). Used for List-Unsubscribe / one-click links.
     * Example: https://api.grclass.com — must match where Express is reachable over HTTPS in production.
     */
    publicApiBaseUrl: (process.env.PUBLIC_API_BASE_URL || process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ''),
    /**
     * RFC 2919 List-Id header value (not including "List-Id:").
     * Gmail shows this name in the Unsubscribe dialog; without it you often see "(Unknown)".
    newsletterListId: (process.env.NEWSLETTER_LIST_ID || 'GR-Class Newsletter').trim(),
    get newsletterUnsubscribeSecret() {
        const s = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
        if (process.env.NODE_ENV === 'production' && (!s || String(s).length < 32)) {
            throw new Error('NEWSLETTER_UNSUBSCRIBE_SECRET must be set to a strong value (32+ chars) in production');
        }
        return s || 'dev-newsletter-unsubscribe-secret-change-me-not-for-production';
    },
    /**
     * Public page URL for newsletter opt-out (footer link + List-Unsubscribe header).
     * Defaults to {FRONTEND_URL}/newsletter/unsubscribe — set NEWSLETTER_UNSUBSCRIBE_URL to override.
     */
    newsletterUnsubscribeUrl: (() => {
        const explicit = process.env.NEWSLETTER_UNSUBSCRIBE_URL;
        if (explicit && String(explicit).trim()) {
            return String(explicit).trim().replace(/\/$/, '');
        }
        const base = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000')
            .replace(/\/$/, '');
        return `${base}/newsletter/unsubscribe`;
    })(),
    passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '10m',
    mail: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.FROM_EMAIL,
    },
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    },
    firebase: {
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './src/config/grclass-platform-firebase-adminsdk-fbsvc-05f339dc4f.json'
    }
};
