import { Agent, AgentVoicePreview } from "../models/agent"
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import LaunchpadAgent from "../models/launchpad/agent";
import agentConfig from "../models/launchpad/agentConfig";
import { randomUUID } from "crypto";
import agent from "../models/launchpad/agent";

const VOICE_PREVIEWS_DIR = path.join(__dirname, '..', 'voice_previews');

const AI_NODE_URL = "http://15.206.168.54:8000"

export const getAllAgents = async () => {
    let agents = await LaunchpadAgent.find({active: true, featured: true})
    return fillAgentWithConfig(agents)
}

export const getAgentsFromTags = async (tag: string = "", country: string = "") => {
    let tagArray = tag ? tag.split(',') : [];
    let agents = [];
    if (tagArray.length > 0) {
        agents = await LaunchpadAgent.find({active: true, tag: {$in: tagArray}})
    } else {
        agents = await LaunchpadAgent.find({active: true})
    }
    // if agent tag has region:country, then make sure those agents are only returned if the country matches
    if (country) {
        agents = agents.filter((agent) => {
            let tag = agent.tag.find((t) => t.startsWith('region:'))
            if (tag) {
                return tag.split(':')[1] === country
            }
            return true
        })
    }
    // sort agents by priority
    agents = agents.sort((a, b) => a.priority - b.priority)
    return fillAgentWithConfig(agents)
}

const fillAgentWithConfig = async (agents: any[]) => {
    let agentConfigs = await agentConfig.find({agent: {$in: agents.map((agent) => agent._id)}})
    return agents.map((agent) => {
        let config = agentConfigs.find((config) => config.agent.toString() === agent._id.toString())
        return {
            ...agent.toObject(),
            image: agent.imageUrl,
            rate: config?.rate,
            language: config?.language,
            languageName: languageCodeToName[config?.language as keyof typeof languageCodeToName]
        }
    })
}

const languageCodeToName = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "hi": "Hindi",
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