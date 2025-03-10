import { Agent, AgentVoicePreview } from "../models/agent"
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import LaunchpadAgent from "../models/launchpad/agent";
import agentConfig from "../models/launchpad/agentConfig";

const VOICE_PREVIEWS_DIR = path.join(__dirname, '..', 'voice_previews');

export const getAllAgents = async () => {
    let agents = await LaunchpadAgent.find({featured: true, active: true})
    let agentConfigs = await agentConfig.find({agent: {$in: agents.map((agent) => agent._id)}})
    return agents.map((agent) => {
        let config = agentConfigs.find((config) => config.agent.toString() === agent._id.toString())
        return {
            ...agent.toObject(),
            image: agent.imageUrl,
            rate: config?.rate,
            language: config?.language
        }
    })
}

export const getAgent = async (agentId: string) => {
    let agent = await LaunchpadAgent.findOne({ _id: agentId });
    return agent;
}

export const getAgentPreviewVoiceline = async (agentId: string) => {
    try {
        await fs.mkdir(VOICE_PREVIEWS_DIR, { recursive: true });

        let agent = await LaunchpadAgent.findOne({ _id: agentId });
        let voicePreviews = await AgentVoicePreview.find({ agentId: agentId });
        let random = Math.floor(Math.random() * voicePreviews.length);
        let preview = voicePreviews[random];
        
        // Generate cache filename based on preview ID
        const audioFilePath = path.join(VOICE_PREVIEWS_DIR, `${preview._id}.wav`);
        
        let audioBuffer: Buffer;
        
        try {
            audioBuffer = await fs.readFile(audioFilePath);
            console.log('Using cached voice preview');
        } catch (error) {
            console.log('Generating new voice preview');
            
            const response = await axios.get('http://15.206.168.54:8000/tts', {
                params: {
                    text: preview.text,
                    personality: agent?.name
                },
                responseType: 'json'
            });
            
            audioBuffer = Buffer.from(response.data.audio, 'base64');
            
            await fs.writeFile(audioFilePath, audioBuffer);
        }
        
        return {
            audio: audioBuffer.toString('base64'),
            format: 'wav',
            sampleRate: 24000
        };
        
    } catch (error) {
        console.error('Error in getAgentPreviewVoiceline:', error);
        throw error;
    }
};