import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
    io.on('connection', (socket) => {
        console.log('Client connected via Socket.IO');
      
        // Send message to the client
        socket.emit('message', 'Hello from Socket.IO server!');
      
        // Receive message from the client
        socket.on('message', (message) => {
          console.log('Received:', message);
        });
      
        // Handle disconnection
        socket.on('disconnect', () => {
          console.log('Client disconnected');
        });
      });
}
