import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import cookieParser from 'cookie-parser';
import routes from './routes.js';
import logger from './utils/logger.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { apiLogger, errorLogger } from './middlewares/api.logger.middleware.js';
import './models/index.js'; // Initialize DB

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
// Security Headers
// app.use(helmet()); 

// CORS
// CORS
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://13.239.63.143:5173',
        'http://13.239.63.143:3000'
    ], // Frontend + Swagger UI (same server)
    credentials: true
}));

// Request Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// API Documentation - Role Based serving
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const SERVER_IP = '13.239.63.143'; // User provided server IP

// Helper to update server URL in swagger JSON
const updateServerUrl = (jsonPath) => {
    try {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const doc = JSON.parse(raw);
        if (isProduction || process.env.USE_SERVER_IP === 'true') {
            doc.servers = [
                { url: `http://${SERVER_IP}:${PORT}/api/v1`, description: 'Production Server' },
                { url: '/api/v1', description: 'Current Host (Relative)' }
            ];
        } else {
            doc.servers = [
                { url: `http://localhost:${PORT}/api/v1`, description: 'Local Development Server' },
                { url: '/api/v1', description: 'Current Host (Relative)' }
            ];
        }
        return doc;
    } catch (e) {
        logger.error(`Error reading swagger file: ${jsonPath}`, e);
        return null;
    }
};

// 1. Redirect root docs to role selector
app.get('/api-docs', (req, res) => {
    const indexPath = path.resolve(__dirname, 'docs/api-docs-index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('API Docs index not found. Run "npm run build:openapi".');
    }
});

// Helper to serve Swagger UI for a role
const serveSwaggerForRole = (role, res) => {
    const htmlPath = path.resolve(__dirname, 'docs/swagger-ui.html');
    if (!fs.existsSync(htmlPath)) return res.status(404).send('Swagger UI template not found');

    fs.readFile(htmlPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading UI template');
        const modifiedHtml = data.replace('"/api-docs-json/all"', `"/api-docs-json/${role}"`);
        res.send(modifiedHtml);
    });
};

// 2. Serve specific role UI - short URLs: /api-docs/admin, /api-docs/gm, etc.
const ROLE_SLUGS = ['admin', 'gm', 'tm', 'to', 'surveyor', 'client'];
ROLE_SLUGS.forEach((role) => {
    app.get(`/api-docs/${role}`, (req, res) => serveSwaggerForRole(role, res));
});

// 2b. Legacy: /api-docs/role/:role
app.get('/api-docs/role/:role', (req, res) => {
    const role = req.params.role;
    if (!/^[a-z0-9-]+$/.test(role)) return res.status(400).send('Invalid role');
    serveSwaggerForRole(role, res);
});

// 3. Serve "All" UI
app.get('/api-docs/all', (req, res) => {
    const htmlPath = path.resolve(__dirname, 'docs/swagger-ui.html');
    if (!fs.existsSync(htmlPath)) return res.status(404).send('Swagger UI template not found');

    fs.readFile(htmlPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading UI template');
        // Already defaults to all, but let's be explicit
        const modifiedHtml = data.replace('"/api-docs-json/all"', `"/api-docs-json/all"`);
        res.send(modifiedHtml);
    });
});

// 4. Serve JSON for specific role
app.get('/api-docs-json/:role', (req, res) => {
    const role = req.params.role;
    let jsonPath;

    if (role === 'all') {
        jsonPath = path.resolve(__dirname, 'docs/swagger-by-role.json');
    } else {
        // Validation to prevent directory traversal
        if (!/^[a-z0-9-]+$/.test(role)) return res.status(400).send('Invalid role');
        jsonPath = path.resolve(__dirname, `docs/roles/swagger-role-${role}.json`);
    }

    if (!fs.existsSync(jsonPath)) {
        return res.status(404).json({ error: 'Documentation for this role not found' });
    }

    const doc = updateServerUrl(jsonPath);
    if (!doc) return res.status(500).send('Error parsing swagger file');

    res.setHeader('Content-Type', 'application/json');
    res.send(doc);
});

// Serve assets
app.use('/api-docs-assets', express.static(path.resolve(__dirname, 'docs/assets')));


// API Request/Response Logger - Logs every API hit with details
app.use('/api/v1', apiLogger);

// Routes
app.use('/api/v1', routes);

// Error Logger - Logs detailed error information
app.use(errorLogger);

// Error Handling
app.use(errorMiddleware);

export default app;
