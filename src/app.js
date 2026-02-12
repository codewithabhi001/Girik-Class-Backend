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
    origin: ['http://localhost:5173', 'http://13.239.63.143:5173'], // Allow Local & Production Frontend
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
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerConfig from './config/swagger.config.js';

const swaggerSpec = swaggerJsdoc(swaggerConfig);
console.log('Swagger Spec Info:', swaggerSpec.info ? swaggerSpec.info.title : 'NO INFO'); // Log for debug

app.get('/api-docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Serve Swagger Custom Assets and UI
app.use('/api-docs-assets', express.static(path.resolve(__dirname, 'docs/assets')));

// Serve the custom Swagger UI HTML directly
app.get('/api-docs', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'docs/index.html'));
});


// API Request/Response Logger - Logs every API hit with details
app.use('/api/v1', apiLogger);

// Routes
app.use('/api/v1', routes);

// Error Logger - Logs detailed error information
app.use(errorLogger);

// Error Handling
app.use(errorMiddleware);

export default app;
