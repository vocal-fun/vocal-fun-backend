import { Server } from 'socket.io';

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
}
