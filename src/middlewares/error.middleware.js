
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const traceId = req.traceId || uuidv4();
    const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'API_ERROR');

    logger.error(`${statusCode} - [${errorCode}] ${message} - ${req.originalUrl} - ${req.method} - ${req.ip} - Trace: ${traceId}`);

    res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message,
        trace_id: traceId,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};

