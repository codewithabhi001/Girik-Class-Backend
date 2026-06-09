import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { io as Client } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import env from '../src/config/env.js';
import db from '../src/models/index.js';
import * as websocketService from '../src/services/websocket.service.js';

describe('WebSocket Server Integration Tests', () => {
    let server;
    let port;
    let token;
    const mockUserId = '11111111-2222-3333-4444-555555555555';
    let originalUserFindByPk;
    let originalSeqAuthenticate;

    before(async () => {
        // Stub DB connection authentication
        originalSeqAuthenticate = db.sequelize.authenticate;
        db.sequelize.authenticate = async () => {};

        // Stub User findByPk to avoid hitting real database in integration test
        originalUserFindByPk = db.User.findByPk;
        db.User.findByPk = async (id) => {
            if (id === mockUserId) {
                return {
                    id: mockUserId,
                    name: 'Test Admin',
                    role: 'ADMIN',
                    status: 'ACTIVE'
                };
            }
            return null;
        };

        // Create HTTP server wrapping Express app
        server = http.createServer(app);
        await websocketService.init(server);

        // Start server on a free ephemeral port
        await new Promise((resolve) => {
            server.listen(0, () => {
                port = server.address().port;
                resolve();
            });
        });

        // Sign test JWT token
        token = jwt.sign(
            { id: mockUserId, role: 'ADMIN', type: 'access' },
            env.jwt.accessSecret,
            { expiresIn: '1h' }
        );
    });

    after(() => {
        // Restore original DB stubs
        db.User.findByPk = originalUserFindByPk;
        db.sequelize.authenticate = originalSeqAuthenticate;

        if (server) {
            server.close();
        }
    });

    it('should refuse unauthorized connections with missing token', (t, done) => {
        const clientSocket = Client(`http://localhost:${port}`, {
            transports: ['websocket'],
            autoConnect: false
        });

        clientSocket.connect();

        clientSocket.on('connect_error', (err) => {
            assert.strictEqual(err.message, 'Authentication token missing');
            clientSocket.close();
            done();
        });
    });

    it('should successfully authenticate and connect with a valid JWT token', (t, done) => {
        const clientSocket = Client(`http://localhost:${port}`, {
            transports: ['websocket'],
            auth: { token },
            autoConnect: false
        });

        clientSocket.connect();

        clientSocket.on('connect', () => {
            assert.ok(clientSocket.connected);
            clientSocket.close();
            done();
        });

        clientSocket.on('connect_error', (err) => {
            done(err);
        });
    });

    it('should receive messages sent to job room after joining', (t, done) => {
        const jobId = '22222222-3333-4444-5555-666666666666';
        const clientSocket = Client(`http://localhost:${port}`, {
            transports: ['websocket'],
            auth: { token },
            autoConnect: false
        });

        clientSocket.connect();

        clientSocket.on('connect', () => {
            // Join job room
            clientSocket.emit('join_job', jobId);

            // Wait briefly for join to complete, then emit mock event from server
            setTimeout(() => {
                const testMsg = { id: 'msg-1', message_text: 'Hello, real-time!' };
                websocketService.emitToRoom(`job:${jobId}:external`, 'message:received', testMsg);
            }, 100);
        });

        clientSocket.on('message:received', (data) => {
            assert.deepStrictEqual(data, { id: 'msg-1', message_text: 'Hello, real-time!' });
            clientSocket.close();
            done();
        });

        clientSocket.on('connect_error', (err) => {
            done(err);
        });
    });
});
