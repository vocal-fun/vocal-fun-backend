import { Server } from 'socket.io';
import WebSocket from 'ws';  // WebSocket client library for connecting to Python server

export const setupSocket = (io: Server) => {
    io.on('connection', (socket) => {
        console.log('Client connected via Socket.IO');
      
        socket.on('message', (message) => {
          console.log('Received:', message);
        });
              socket.on('disconnect', () => {
          console.log('Client disconnected');
        });
      });

    const callNamespace = io.of('/call');

    callNamespace.on('connection', (socket) => {
    console.log('Client connected via /call namespace');
    

    socket.on('message', (message) => {
        console.log('Received on /call:', message);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from /call namespace');
    });
    });

    setupAISocket(io);
}

const setupAISocket = (io: Server) => {
    // WebSocket connection to the Python WebSocket server
    const pythonWs = new WebSocket('ws://15.206.168.54:8000/ws');

    // Handle connection to Python WebSocket server
    pythonWs.on('open', () => {
    console.log('Connected to Python WebSocket server');
    });

    // Handle incoming messages from Python WebSocket server and forward to Socket.IO clients
    pythonWs.on('message', (message: any) => {
    console.log('Message from Python server:', message);
        // Broadcast message to all connected Socket.IO clients in the /call namespace
        io.of('/call').emit('message', message);
    });
}
