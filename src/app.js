import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
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
app.use(helmet());

// CORS
app.use(cors({
    origin: 'http://localhost:5173', // Adjust to frontend URL
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

// API Documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

const swaggerOptions = {
    explorer: true,
    customCss: `
        /* Top Bar - Deep Blue */
        .swagger-ui .topbar { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-bottom: 3px solid #5a67d8;
        }
        
        /* Title - Bold and Modern */
        .swagger-ui .info .title { 
            color: #2d3748; 
            font-size: 2.8em; 
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        
        /* Description - Clean and Readable */
        .swagger-ui .info .description { 
            font-size: 1.1em; 
            line-height: 1.8; 
            color: #4a5568;
        }
        
        /* Tags - Vibrant Colors */
        .swagger-ui .opblock-tag { 
            font-size: 1.4em; 
            font-weight: 700;
            border-bottom: 3px solid #667eea; 
            padding: 15px 0;
            color: #2d3748;
        }
        
        /* Opblock Base */
        .swagger-ui .opblock { 
            border: 2px solid #e2e8f0; 
            margin: 12px 0; 
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
        }
        
        .swagger-ui .opblock:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        /* POST - Vibrant Green */
        .swagger-ui .opblock.opblock-post { 
            border-color: #48bb78; 
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background: #48bb78;
        }
        
        /* GET - Bright Blue */
        .swagger-ui .opblock.opblock-get { 
            border-color: #4299e1; 
            background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background: #4299e1;
        }
        
        /* PUT - Warm Orange */
        .swagger-ui .opblock.opblock-put { 
            border-color: #ed8936; 
            background: linear-gradient(135deg, #fffaf0 0%, #feebc8 100%);
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
            background: #ed8936;
        }
        
        /* DELETE - Bold Red */
        .swagger-ui .opblock.opblock-delete { 
            border-color: #f56565; 
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
            background: #f56565;
        }
        
        /* PATCH - Purple */
        .swagger-ui .opblock.opblock-patch { 
            border-color: #9f7aea; 
            background: linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%);
        }
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
            background: #9f7aea;
        }
        
        /* Authorize Button - Gradient */
        .swagger-ui .btn.authorize { 
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            border: none;
            color: white;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
        }
        .swagger-ui .btn.authorize:hover {
            background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
        }
        .swagger-ui .btn.authorize svg { 
            fill: white; 
        }
        
        /* Details/Summary - Interactive */
        .swagger-ui details summary { 
            cursor: pointer; 
            font-weight: 600; 
            padding: 12px 16px; 
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 6px;
            border-left: 4px solid #667eea;
            transition: all 0.2s ease;
        }
        .swagger-ui details summary:hover {
            background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
            border-left-color: #5a67d8;
        }
        .swagger-ui details[open] summary { 
            background: linear-gradient(135deg, #ebf4ff 0%, #c3dafe 100%);
            border-left-color: #4299e1;
        }
        
        /* Try it out button */
        .swagger-ui .btn.try-out__btn {
            background: #667eea;
            color: white;
            border: none;
            font-weight: 600;
        }
        .swagger-ui .btn.try-out__btn:hover {
            background: #5a67d8;
        }
        
        /* Execute button */
        .swagger-ui .btn.execute {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            border: none;
            color: white;
            font-weight: 600;
        }
        
        /* Response codes */
        .swagger-ui .responses-inner h4 {
            font-weight: 600;
        }
        .swagger-ui .response-col_status {
            font-weight: 700;
        }
        
        /* Models */
        .swagger-ui .model-box {
            border-radius: 6px;
        }
        
        /* Scrollbar */
        .swagger-ui ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        .swagger-ui ::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .swagger-ui ::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 5px;
        }
        .swagger-ui ::-webkit-scrollbar-thumb:hover {
            background: #5a67d8;
        }
    `,
    customSiteTitle: "GIRIK API Documentation",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
            activate: true,
            theme: "monokai"
        }
    }
};

// API Documentation — single Swagger doc: navigate by role (tags = "Role » Module")
const loadSwaggerByRole = () => {
    const p = path.join(__dirname, 'docs', 'swagger-by-role.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    return null;
};
const byRoleDoc = loadSwaggerByRole();
const swaggerOptionsByRole = { ...swaggerOptions, customSiteTitle: 'GIRIK API - All APIs (navigate by role)' };

// Single Swagger UI at /api-docs (and /api-docs/) — one document, filter/scroll by role (Admin » Users, Client » Jobs, etc.)
if (byRoleDoc) {
    app.use('/api-docs', swaggerUi.serveFiles(byRoleDoc, swaggerOptionsByRole), swaggerUi.setup(byRoleDoc, swaggerOptionsByRole));
} else {
    app.get('/api-docs', (req, res) => res.status(503).send('Run: npm run generate:swagger'));
}


// API Request/Response Logger - Logs every API hit with details
app.use('/api/v1', apiLogger);

// Routes
app.use('/api/v1', routes);

// Error Logger - Logs detailed error information
app.use(errorLogger);

// Error Handling
app.use(errorMiddleware);

export default app;
