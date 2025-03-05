import { Server } from 'socket.io';
import WebSocket from 'ws';  // WebSocket client library for connecting to Python server
import { getValidatedSession } from './services/callService';
import { decodeJwt } from './middleware/auth';
import { Agent } from './models/agent';
import dotenv from 'dotenv';
import LaunchpadAgent from './models/launchpad/agent';
import AgentConfig from './models/launchpad/agentConfig';

dotenv.config();

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
            socket.disconnect(true);
            return;
        }
        
        let user = await decodeJwt(token);

        if (!user) {
            console.log('Invalid token');
            socket.disconnect(true);
            return;
        }

        const sessionId = socket.handshake.auth.sessionId as string;
        let session = await getValidatedSession(sessionId);
        if (!session) {
            console.log('Invalid session ID');
            socket.disconnect(true);
            return;
        }

        let agentId = session.agentId;
        let userId = session.userId;

        let agent = await LaunchpadAgent.findById(agentId);
        let agentConfig = await AgentConfig.findOne({ agent: agentId });

        if (!agent) {
            console.log('Agent not found');
            socket.disconnect(true);
            return;
        }

        socket.join(sessionId);

        console.log('new call socket connection', sessionId, agentId, userId, agent!.actualName);
        // Connect to Python AI WebSocket server with sessionId
        console.log('Connecting to AI WebSocket server...');
        const pythonWs = new WebSocket(`ws://${process.env.AI_NODE_URL}/ws/${sessionId}`);
        
        // Track speaking state
        let isSpeaking = false;

        pythonWs.on('open', () => {
            console.log('Connected to Python WebSocket server');
            pythonWs.send(JSON.stringify({
                agentId: agentId,
                agentName: agent!.name,
                userId: userId,
                configId: agentConfig!._id.toString(),
                systemPrompt: agentConfig!.systemPrompt,
                voiceSampleUrl: agentConfig!.voiceSampleUrl,
                cartesiaVoiceId: agentConfig!.cartesiaVoiceId,
                elevenLabsVoiceId: agentConfig!.elevenLabsVoiceId,
                llmModel: agentConfig!.llmModel,
                sttModel: agentConfig!.sttModel,
                ttsModel: agentConfig!.ttsModel,
                rate: agentConfig!.rate
            }));
        });

        pythonWs.on('message', (message: any) => {
            try {
                // Parse incoming message from Python server
                const data = JSON.parse(message.toString());
                
                // ai node ready
                if (data.type == "call_ready") {
                    // notify client that call is ready
                    socket.emit('call_ready');
                }

                if (data.type === 'tts_stream') {
                    console.log('Received TTS stream:', data.data.length);
                    // Forward TTS audio chunks to client
                    socket.emit('audio_stream', data.data);
                } if (data.type === 'tts_stream_end') {
                    console.log('Received TTS stream end');
                    // notify client that TTS stream has ended
                    socket.emit('audio_stream_end');
                } else {
                    // Forward other messages to client
                    socket.emit('message', data);
                }
            } catch (error) {
                console.error('Error processing message from Python server:', error);
            }
        });

        pythonWs.on('error', (error: any) => {
            console.error('WebSocket error:', error);
            socket.emit('error', { message: 'AI server connection error' });
        });

        pythonWs.on('close', () => {
            console.log('Connection to Python server closed');
            socket.emit('ai_disconnected');
        });

        socket.on('audio_data', (audioBuffer: ArrayBuffer) => {
            if (pythonWs.readyState === WebSocket.OPEN) {
                // Send the Int16 audio data directly
                pythonWs.send(audioBuffer);
            }
        });

        socket.on('speech_start', () => {
            console.log('Received speech start');
            if (pythonWs.readyState === WebSocket.OPEN && !isSpeaking) {
                isSpeaking = true;
                pythonWs.send(JSON.stringify({ 
                    type: 'speech_start'
                }));
            }
        });

        socket.on('speech_end', () => {
            console.log('Received speech end');
            if (pythonWs.readyState === WebSocket.OPEN && isSpeaking) {
                isSpeaking = false;
                pythonWs.send(JSON.stringify({ 
                    type: 'speech_end'
                }));
            }
        });

        socket.on('transcript', (data: any) => {
            console.log('Received transcript', data);
            if (pythonWs.readyState === WebSocket.OPEN) {
                console.log('Sending to AI server', data.text);
                pythonWs.send(JSON.stringify({ 
                    type: 'transcript',
                    text: data.text
                }));
            }
        });

        // Handle other custom events
        socket.on('custom_event', (data: any) => {
            if (pythonWs.readyState === WebSocket.OPEN) {
                pythonWs.send(JSON.stringify({
                    type: 'custom_event',
                    data: data
                }));
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected from /call namespace');
            if (pythonWs.readyState === WebSocket.OPEN) {
                pythonWs.close();
            }
        });

    } catch (e) {
        console.error('Error in call socket connection:', e);
        socket.disconnect();
    }
};