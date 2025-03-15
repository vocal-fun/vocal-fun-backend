import { Agent, AgentVoicePreview } from "../models/agent"
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import LaunchpadAgent from "../models/launchpad/agent";
import agentConfig from "../models/launchpad/agentConfig";
import { randomUUID } from "crypto";

const VOICE_PREVIEWS_DIR = path.join(__dirname, '..', 'voice_previews');

const AI_NODE_URL = "http://15.206.168.54:8000"

export const getAllAgents = async (tag: string = "") => {
    let tagArray = tag ? tag.split(',') : [];
    let agents = await LaunchpadAgent.find({featured: true, active: true, tag: {$in: tagArray}})
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

        if (!preview) {
            console.log('No preview found, creating new one');
            // create new preview voiceline from chat endpoint
            let config = await getAINodeAgentConfig(agentId)
            let sessionId = randomUUID()
            const response = await axios.post(`${AI_NODE_URL}/chat`, {
                text: "Who the fuck are you? What the fuck do you do?",
                config: config,
                config_id: config.configId,
                session_id: sessionId
            });
            let text = response.data.response
            console.log('New preview created for agent', config.agentName, text);
            preview = await AgentVoicePreview.create({
                agentId: agentId,
                text: text,
            })
        }
        
        // Generate cache filename based on preview ID
        const audioFilePath = path.join(VOICE_PREVIEWS_DIR, `${preview._id}.wav`);
        
        let audioBuffer: Buffer;
        
        try {
            audioBuffer = await fs.readFile(audioFilePath);
            console.log('Using cached voice preview');
        } catch (error) {
            console.log('Generating new voice preview');
            
            let config = await getAINodeAgentConfig(agentId)
            const response = await axios.post(`${AI_NODE_URL}/tts`, {
                text: preview.text,
                config: config,
                config_id: config.configId,
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

// config for the AI node
export const getAINodeAgentConfig = async (agentId: string, userId: string = "") => {
   let agent = await LaunchpadAgent.findOne({ _id: agentId });
   let config = await agentConfig.findOne({ agent: agentId });
   return {
        agentId: agentId,
        agentName: agent!.name,
        userId: userId,
        configId: config!._id.toString(),
        systemPrompt: config!.systemPrompt,
        voiceSampleUrl: config!.voiceSampleUrl,
        cartesiaVoiceId: config!.cartesiaVoiceId,
        elevenLabsVoiceId: config!.elevenLabsVoiceId,
        llmModel: config!.llmModel,
        sttModel: config!.sttModel,
        ttsModel: config!.ttsModel,
        rate: config!.rate,
        language: config!.language
    }
}