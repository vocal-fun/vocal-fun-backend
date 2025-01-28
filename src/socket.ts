import { Server } from 'socket.io';
import WebSocket from 'ws';  // WebSocket client library for connecting to Python server
import { getValidatedSession } from './services/callService';
import { decodeJwt } from './middleware/auth';

let userIo: any;
let callIo: any

export const setupSocket = (io: Server) => {
    userIo = io;

    io.on('connection', async (socket) => {
        console.log('Client connected via Socket.IO');
        try {
            newSocketConnection(socket);
        } catch (e) {
            console.log(e)
        }
    });

    try {
        callIo = io.of('/call');
        callIo.on('connection', async (socket: any) => {
            try {
                newCallSocketConnection(socket);
            } catch (e) {
                console.log(e)
            }
        });
    } catch (e) {
        console.log(e)
    }
}

export const sendUserSocketMessage = (address: string, event: string, data: any) => {
    userIo.to(address).emit(event, data);
}

const newSocketConnection = async (socket: any) => {
    try {
        let token = socket.handshake.auth.token;
        let user = await decodeJwt(token);
    
        let isAuthenticated = user && user.address;
    
        console.log('User connected:', isAuthenticated ? user!.address : 'unauthenticated');
    
        if (isAuthenticated && user) {
            socket.join(user.address);
        }
    
        socket.on('message', (message: any) => {
          console.log('Received:', message);
        });
    
        socket.on('disconnect', () => {
          console.log('Client disconnected');
        });
    } catch (e) {
        console.log(e)
        socket.disconnect();
    }
}
   

const newCallSocketConnection = async (socket: any) => {
    try {

        console.log('Client connected via /call namespace');

    let token = socket.handshake.auth.token;
    
    if (!token) {
        console.log('Authentication required');
        socket.disconnect();
        return;
    }
    
    let user = await decodeJwt(token);

    if (!user) {
        console.log('Invalid token');
        socket.disconnect();
        return;
    }

    const sessionId = socket.handshake.auth.sessionId as string;
    let session = await getValidatedSession(sessionId);
    if (!session) {
        console.log('Invalid session ID');
        socket.disconnect();
        return;
    }

    socket.join(sessionId);

    let agentId = session.agentId;
    let userId = session.userId;

    // ===== python AI socket =====
    console.log('Connecting to AI WebSocket server...');
    const pythonWs = new WebSocket('ws://15.206.168.54:8000/ws');

    pythonWs.on('open', () => {
        console.log('Connected to Python WebSocket server');
        // send ready event to client when we are connected to AI server
        socket.emit('call_ready')
    });

    pythonWs.on('message', (message: any) => {
        console.log('Message from Python server:', message);
        socket.emit('message', message);
    });
    // =============================


    // ====== Call socket ======
    socket.onAny((event: any, data: any) => {
        console.log(`Received event from client: ${event}`, data);
        if (pythonWs.readyState === WebSocket.OPEN) {
            pythonWs.send(JSON.stringify({ type: event, data: data }));
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from /call namespace');
    });
    // ================================
    } catch (e) {
        console.log(e)
        socket.disconnect();
    }

}
