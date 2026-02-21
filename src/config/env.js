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
        name: process.env.DB_NAME || 'girik_db',
        dialect: process.env.DB_DIALECT || 'mysql',
        sslCa: process.env.DB_SSL_CA,
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
    },
    frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
    passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
    mail: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.FROM_EMAIL,
    },
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    }
};
