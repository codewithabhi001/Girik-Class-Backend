import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import db from '../models/index.js';
import logger from '../utils/logger.js';
import * as tokenBlacklistService from './tokenBlacklist.service.js';

let io = null;

/**
 * Parses raw cookie headers into an object mapping names to values.
 * @param {string} cookieHeader
 * @returns {Record<string, string>}
 */
const parseCookies = (cookieHeader) => {
    if (!cookieHeader) return {};
    return cookieHeader.split(';').reduce((acc, cookie) => {
        const parts = cookie.split('=');
        if (parts[0]) {
            acc[parts[0].trim()] = (parts[1] || '').trim();
        }
        return acc;
    }, {});
};

/**
 * Extracts and verifies token from handshake.
 * @param {import('socket.io').Socket} socket 
 * @returns {Promise<any>} The authenticated user object
 */
const authenticateSocket = async (socket) => {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
    }
    
    // Check cookies in headers as fallback
    if (!token && socket.handshake.headers?.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies.token;
    }

    if (!token) {
        throw new Error('Authentication token missing');
    }

    if (await tokenBlacklistService.isTokenBlacklisted(token)) {
        throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(token, env.jwt.accessSecret);
    if (decoded.type === 'refresh') {
        throw new Error('Invalid token type');
    }

    const user = await db.User.findByPk(decoded.id);
    if (!user) {
        throw new Error('User not found');
    }

    if (user.status !== 'ACTIVE') {
        throw new Error(`Account status is: ${user.status}`);
    }

    return user;
};

/**
 * Registers events on socket connection.
 * @param {import('socket.io').Socket} socket 
 */
const registerSocketEvents = (socket) => {
    const user = socket.user;
    logger.info(`[WebSocket] Client connected: ${user.name} (${user.role}), ID: ${user.id}, Socket ID: ${socket.id}`);

    // Join core/RBAC rooms
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);
    
    if (user.role === 'CLIENT' && user.client_id) {
        socket.join(`client:${user.client_id}`);
    }

    // Dynamic Job rooms subscription
    socket.on('join_job', (jobId) => {
        if (jobId) {
            // All roles associated with the job join the external/general room
            socket.join(`job:${jobId}:external`);
            logger.info(`[WebSocket] User ${user.name} (${user.id}) joined room: job:${jobId}:external`);

            // Only internal staff roles join the internal-only room
            if (['ADMIN', 'GM', 'TM', 'TO'].includes(user.role)) {
                socket.join(`job:${jobId}:internal`);
                logger.info(`[WebSocket] User ${user.name} (${user.id}) joined internal room: job:${jobId}:internal`);
            }
        }
    });

    socket.on('leave_job', (jobId) => {
        if (jobId) {
            socket.leave(`job:${jobId}:external`);
            if (['ADMIN', 'GM', 'TM', 'TO'].includes(user.role)) {
                socket.leave(`job:${jobId}:internal`);
            }
            logger.info(`[WebSocket] User ${user.name} (${user.id}) left rooms for job: ${jobId}`);
        }
    });

    socket.on('disconnect', () => {
        logger.info(`[WebSocket] Client disconnected: ${user.name}, Socket ID: ${socket.id}`);
    });
};

/**
 * Initialize WebSocket server
 * @param {import('http').Server} server 
 */
export const init = async (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true
        }
    });

    // 1. Configure Redis Adapter if REDIS_URL is provided for scaling
    if (process.env.REDIS_URL) {
        try {
            const pubClient = createClient({ url: process.env.REDIS_URL });
            const subClient = pubClient.duplicate();

            pubClient.on('error', (err) => logger.error('[WebSocket] Redis pubClient error:', err));
            subClient.on('error', (err) => logger.error('[WebSocket] Redis subClient error:', err));

            await Promise.all([pubClient.connect(), subClient.connect()]);
            
            io.adapter(createAdapter(pubClient, subClient));
            logger.info('[WebSocket] Redis adapter configured successfully.');
        } catch (err) {
            logger.error('[WebSocket] Failed to configure Redis adapter, falling back to local adapter:', err);
        }
    } else {
        logger.info('[WebSocket] Running in single-node mode (No Redis configured).');
    }

    // 2. Auth Handshake Middleware
    io.use(async (socket, next) => {
        try {
            const user = await authenticateSocket(socket);
            socket.user = user;
            next();
        } catch (err) {
            logger.error('[WebSocket] Auth handshake failed:', err.message);
            return next(new Error(err.message || 'Unauthorized'));
        }
    });

    // 3. Connect Event Handling
    io.on('connection', registerSocketEvents);

    return io;
};

/**
 * Emit event to a specific user's room
 * @param {string} userId 
 * @param {string} event 
 * @param {any} data 
 */
export const emitToUser = (userId, event, data) => {
    if (!io) {
        logger.warn(`[WebSocket] emitToUser failed: io is null. userId: ${userId}, event: ${event}`);
        return;
    }
    io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit event to a specific role room
 * @param {string} role 
 * @param {string} event 
 * @param {any} data 
 */
export const emitToRole = (role, event, data) => {
    if (!io) {
        logger.warn(`[WebSocket] emitToRole failed: io is null. role: ${role}, event: ${event}`);
        return;
    }
    io.to(`role:${role}`).emit(event, data);
};

/**
 * Emit event to any specific room
 * @param {string} room 
 * @param {string} event 
 * @param {any} data 
 */
export const emitToRoom = (room, event, data) => {
    if (!io) {
        logger.warn(`[WebSocket] emitToRoom failed: io is null. room: ${room}, event: ${event}`);
        return;
    }
    logger.info(`[WebSocket] Broadcasting to room: ${room}, event: ${event}`);
    io.to(room).emit(event, data);
};

/**
 * Get active io server instance
 * @returns {import('socket.io').Server|null}
 */
export const getIo = () => io;
