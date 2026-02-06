import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import cookieParser from 'cookie-parser';
import routes from './routes.js';
import logger from './utils/logger.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
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

// API Documentation - Role Based
import fs from 'fs';
const rolesDir = path.join(__dirname, 'docs', 'roles');
const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
        urls: [
            { url: '/api-docs/admin.json', name: 'Role: ADMIN' },
            { url: '/api-docs/gm.json', name: 'Role: GM' },
            { url: '/api-docs/tm.json', name: 'Role: TM' },
            { url: '/api-docs/to.json', name: 'Role: TO' },
            { url: '/api-docs/surveyor.json', name: 'Role: SURVEYOR' },
            { url: '/api-docs/client.json', name: 'Role: CLIENT' },
            { url: '/api-docs/all.json', name: 'Role: ALL (Public/Auth)' }
        ]
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, swaggerOptions));

// Serve the actual JSON files
app.get('/api-docs/:role.json', (req, res) => {
    const filePath = path.join(rolesDir, req.params.role + '.json');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Spec not found');
    }
});


// Routes
app.use('/api/v1', routes);

// Error Handling
app.use(errorMiddleware);

export default app;
