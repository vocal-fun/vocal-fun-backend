import { Types } from "mongoose";
import { CallSession } from "../models/call";
import { getAgent } from "./agentsService";
import { getUserById } from "./userService";

export const startCall = async (userId: string, agentId: string) => {
    console.log('starting call', userId, agentId);

    let user = await getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    if (user.balance <= 0) {
        throw new Error('Insufficient balance');
    }

    let agent = await getAgent(agentId);
    if (!agent) {
        throw new Error('Agent not found');
    }
    
    const newSession = new CallSession({
        userId: user._id,
        agentId: agent._id,
        status: 'starting',
    });

    await newSession.save();

    return newSession;
}

export const getValidatedSession = async (sessionId: string) => {
    let session = await CallSession.findOne({ _id: new Types.ObjectId(sessionId) });
    if (!session) {
        console.log('Session not found', sessionId);
       return null
    }
    return session
}