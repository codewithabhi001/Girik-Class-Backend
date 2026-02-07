
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorCode = err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'API_ERROR');
    const traceId = req.traceId || uuidv4();

    // Specific handling for Sequelize Errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = err.errors.map(e => e.message).join(', ');
    }

    logger.error(`${statusCode} - [${errorCode}] ${message} - ${req.originalUrl} - ${req.method} - ${req.ip} - Trace: ${traceId}`);

    res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message,
        trace_id: traceId,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};

