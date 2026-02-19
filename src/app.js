import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import cookieParser from 'cookie-parser';
import routes from './routes.js';
import logger from './utils/logger.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { apiLogger, errorLogger } from './middlewares/api.logger.middleware.js';
import { setupSwagger } from './middlewares/swagger.middleware.js';
import './models/index.js'; // Initialize DB

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
    ],
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

// API Request/Response Logger - Logs every API hit with details
if(process.env.NODE_ENV = 'PRODUCTION'){
    app.use('/api/v1', apiLogger);
}


// Routes
app.use('/api/v1', routes);

// OpenAPI Swagger docs (role-specific: /api-docs, /api-docs/admin, /api-docs/gm, etc.)
setupSwagger(app);

// Error Logger - Logs detailed error information
app.use(errorLogger);

// Error Handling
app.use(errorMiddleware);

export default app;
