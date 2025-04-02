import { Server } from 'socket.io';
import WebSocket from 'ws';  // WebSocket client library for connecting to Python server
import { getValidatedSession } from './services/callService';
import { decodeJwt } from './middleware/auth';
import { Agent } from './models/agent';
import dotenv from 'dotenv';
import LaunchpadAgent from './models/launchpad/agent';
import AgentConfig from './models/launchpad/agentConfig';
import { getUserById } from './services/userService';
import { deductUserVocalCredits } from './services/vocalService';

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
        const client = socket.handshake.auth.client as string;
        const country = socket.handshake.auth.country as string;
        const audioFormat = socket.handshake.auth.audioFormat as string || "pcm";
        const vadThreshold = socket.handshake.auth.vadThreshold as number || 0.5;

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
        
        const currentUser = await getUserById(userId);

        let shouldDeductBalance = false;
        if (currentUser?.provider == "glip") {
            shouldDeductBalance = true;
        }

        // Initial balance check and notification
        try {
            if (currentUser) {
                socket.emit('balance_update', { 
                    balance: currentUser.balance,
                    message: 'Call started. Credits will be deducted periodically.'
                });
                
                // If user has insufficient credits, don't allow the call to start
                if (currentUser.balance <= 0) {
                    socket.emit('balance_update', { 
                        balance: currentUser.balance,
                        message: 'Insufficient vocal credits. Please recharge your account.'
                    });
                    socket.disconnect(true);
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking initial user balance:', error);
        }
        
        let balanceInterval: NodeJS.Timeout;

        if (shouldDeductBalance) {
            // Set up balance tracking
            // Use the agent's rate from agentConfig instead of a fixed rate
            const CREDIT_DEDUCTION_RATE = agentConfig?.rate || 1; // Credits to deduct per minute
            const DEDUCTION_INTERVAL = 10000; // Deduct every 10 seconds
            
            // Calculate how much to deduct per interval (prorated from the per-minute rate)
            const intervalRate = (CREDIT_DEDUCTION_RATE / 60) * (DEDUCTION_INTERVAL / 1000);
            
            // Start periodic balance deduction
            balanceInterval = setInterval(async () => {
                try {
                    // Deduct credits based on the prorated interval rate
                    const updatedBalance = await deductUserVocalCredits(userId, intervalRate);
                    
                    // Check if user has run out of credits
                    if (!updatedBalance || updatedBalance <= 0) {
                        console.log('User ran out of credits, disconnecting');
                        clearInterval(balanceInterval);
                        socket.emit('balance_update', { 
                            balance: updatedBalance,
                            message: 'You have run out of vocal credits. Call will be disconnected.'
                        });

                        socket.emit('call_ending', { 
                            reason: 'insufficient_credits',
                            message: 'You have run out of vocal credits. Call will be disconnected.'
                        });
                        
                        
                        // Notify AI server that call is ending due to insufficient credits
                        if (pythonWs.readyState === WebSocket.OPEN) {
                            pythonWs.send(JSON.stringify({ 
                                type: 'call_end',
                                reason: 'insufficient_credits'
                            }));
                        }
                        
                        // Disconnect after a short delay to allow message to be received
                        setTimeout(() => {
                            socket.disconnect(true);
                        }, 10000);
                        return;
                    }
                    
                    // Send balance update to user
                    sendUserSocketMessage(user.address, 'balance_update', { 
                        balance: updatedBalance,
                        deducted: intervalRate,
                        rate: CREDIT_DEDUCTION_RATE
                    });
                    
                    // Also send to the current socket
                    socket.emit('balance_update', { 
                        balance: updatedBalance,
                        deducted: intervalRate,
                        rate: CREDIT_DEDUCTION_RATE
                    });
                    
                    console.log(`Deducted ${intervalRate.toFixed(2)} credits from user ${userId} (rate: ${CREDIT_DEDUCTION_RATE}/min). New balance: ${updatedBalance}`);
                    
                } catch (error) {
                    console.error('Error updating user balance:', error);
                }
            }, DEDUCTION_INTERVAL);
        }

        // Connect to Python AI WebSocket server with sessionId
        console.log('Connecting to AI WebSocket server...');
        const pythonWs = new WebSocket(`ws://${process.env.AI_NODE_URL}/ws/${sessionId}`);
        
        // Track speaking state
        let isSpeaking = false;

        let config: any = {
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
            rate: agentConfig!.rate,
            language: agentConfig!.language,
            speed: 1.1,
            format: audioFormat,
            vadThreshold: vadThreshold
        }

        if (client && client == "glip-android") {
            config.speechDetectorConfig = {
                "energy_threshold": 0.05,
                "min_speech_duration": 0.4,
                "max_silence_duration": 0.5,
                "max_recording_duration": 10.0
            }
        }
        pythonWs.on('open', () => {
            console.log('Connected to Python WebSocket server');
            pythonWs.send(JSON.stringify(config));
        });

        pythonWs.on('message', (message: Buffer) => {
            try {
               // Parse incoming message from Python server
               const data = JSON.parse(message.toString());
                    
               // ai node ready
               if (data.type == "call_ready") {
                   // notify client that call is ready
                   socket.emit('call_ready');
               }

               if (data.type === 'audio_stream') {
                   // Forward TTS audio chunks to client
                   socket.emit('audio_stream', data.data);
               } if (data.type === 'audio_stream_end') {
                   console.log('Received TTS stream end');
                   // notify client that TTS stream has ended
                   socket.emit('audio_stream_end');
               } else {
                   // Forward other messages to client
                   socket.emit('message', data);
               }
            } catch (error) {
                console.error('Error processing message from Python server:', error, 'Raw message:', message.toString()); // Log raw message on error
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
            // Clear the balance deduction interval when user disconnects
            if (balanceInterval) {
                clearInterval(balanceInterval);
            }
            
            if (pythonWs.readyState === WebSocket.OPEN || pythonWs.readyState === WebSocket.CONNECTING) { // Check connecting state too
                pythonWs.close();
            }
        });

    } catch (e) {
        console.error('Error in call socket connection:', e);
        socket.disconnect();
    }

    const isBufferBinary = (buffer: Buffer) => {
        try {
            // Try to decode the buffer as a UTF-8 string
            const decodedString = buffer.toString('utf8');
            
            // Check if the buffer is a valid UTF-8 string
            // If decoding is successful, and the decoded string matches the buffer, it's a string
            if (decodedString && decodedString === buffer.toString('utf8')) {
                return 'string';
            } else {
                return 'binary';
            }
        } catch (err) {
            // If an error occurs (e.g., invalid UTF-8), it's considered binary
            return 'binary';
        }
    };
};
