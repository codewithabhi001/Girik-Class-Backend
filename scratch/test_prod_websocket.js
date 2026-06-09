import { io as Client } from 'socket.io-client';

// The deployed API base URL (Nginx server)
const SOCKET_URL = 'https://api.grclass.com';

console.log(`Connecting to WebSocket server at: ${SOCKET_URL}`);

// Note: In production, socket connection will reject with "Authentication token missing"
// if no token is passed. However, getting "Authentication token missing" from the server
// proves that the WebSocket handshake succeeded, the connection was upgraded by Nginx,
// and the request reached the Node.js application!
const socket = Client(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false
});

socket.connect();

socket.on('connect', () => {
    console.log('✅ Connection SUCCESSFUL!');
    console.log(`Socket ID: ${socket.id}`);
    socket.close();
    process.exit(0);
});

socket.on('connect_error', (err) => {
    if (err.message === 'Authentication token missing') {
        console.log('✅ Handshake SUCCESSFUL! WebSocket connection was upgraded and reached the backend.');
        console.log(`Status: Connection rejected correctly by backend auth with error: "${err.message}"`);
    } else {
        console.log('❌ Connection FAILED!');
        console.error('Error Details:', err.message || err);
    }
    socket.close();
    process.exit(0);
});
