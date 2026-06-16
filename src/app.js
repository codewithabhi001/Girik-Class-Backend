import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import cookieParser from 'cookie-parser';
import routes from './routes.js';
import logger from './utils/logger.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { apiLogger, errorLogger } from './middlewares/api.logger.middleware.js';
import { setupSwagger } from './middlewares/swagger.middleware.js';
import { contextMiddleware } from './middlewares/context.middleware.js';
import { probeBlockMiddleware } from './middlewares/probe-block.middleware.js';
import { isAuthRateLimitedRoute, rateLimitClientKey } from './middlewares/rate-limit.util.js';
import { optionalAuthenticate } from './middlewares/auth.middleware.js';
import { checkMaintenanceMode } from './middlewares/maintenance.middleware.js';
import './models/index.js'; // Initialize DB

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsRoot = path.resolve(__dirname, '..', 'docs');

// 0. Context Storage (Must be first to wrap all callbacks)
app.use(contextMiddleware);

// Trust proxy for rate limiting behind Nginx/CloudFront
app.set('trust proxy', 1);

// Drop scanner paths (/secrets.json, phpinfo.php, etc.) before they hit rate limits or heavy logging
app.use(probeBlockMiddleware);

// CORS
const allowedOrigins = [
    '*'
];

/** Webmail origins that POST for RFC 8058 List-Unsubscribe one-click (e.g. Gmail next to sender). */
const mailUnsubscribeOrigins = new Set([
    'https://mail.google.com',
    'https://outlook.live.com',
    'https://outlook.office.com',
    'https://webmail.yahoo.com',
    'https://mail.yahoo.com'
]);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        // Allow any origin if wildcard '*' is configured
        if (allowedOrigins.includes('*')) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        if (mailUnsubscribeOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "cdn.grclass.com", "https://*.s3.amazonaws.com"],
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Request Logging (skip noise from blocked scanner probes)
app.use(morgan('combined', {
    skip: (req, res) => res.statusCode === 404 && !req.path?.startsWith('/api/v1'),
    stream: { write: message => logger.info(message.trim()) }
}));

// Body Parsing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(cookieParser());

// Rate limiting — API only; auth/login has its own limiter in auth.routes.js
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 400,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rateLimitClientKey,
    skip: isAuthRateLimitedRoute,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/v1', limiter);

// API Request/Response Logger - Logs every API hit with details
app.use('/api/v1', apiLogger);

// Global Maintenance Mode check
app.use('/api/v1', optionalAuthenticate);
app.use('/api/v1', checkMaintenanceMode);

// Routes
app.use('/api/v1', routes);

// OpenAPI Swagger docs (rol e-specific: /api-docs, /api-docs/admin, /api-docs/gm, etc.)
setupSwagger(app);

// Serve generated docs folder (module-wise swagger, role-wise docs, etc.)
app.use('/docs', express.static(docsRoot));

// Friendly module swagger route without extension.
app.get('/docs/swagger-by-module/:module', (req, res) => {
    const moduleName = String(req.params.module || '').trim();
    const baseDir = path.join(docsRoot, 'swagger-by-module');
    const yamlFile = path.join(baseDir, `${moduleName}.yaml`);
    const jsonFile = path.join(baseDir, `${moduleName}.json`);

    if (fs.existsSync(yamlFile)) {
        return res.sendFile(yamlFile);
    }
    if (fs.existsSync(jsonFile)) {
        return res.sendFile(jsonFile);
    }

    return res.status(404).json({
        success: false,
        message: `Module swagger not found for '${moduleName}'.`,
    });
});

// Error Logger - Logs detailed error information
app.use(errorLogger);

// Error Handling
app.use(errorMiddleware);

export default app;
