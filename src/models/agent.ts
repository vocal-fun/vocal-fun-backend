import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAgent {
    _id: Types.ObjectId;
    name: string;
    actualName: string;
    image: string;
    createdAt: Date;
    twitter: string;
    rate: number;
    language: string;
}

export interface AgentDocument extends Omit<IAgent, '_id'>, Document {}

const agentSchema = new Schema<AgentDocument>({
    name: {
        type: String,
        required: true,
        unique: false
    },
    actualName: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    rate: {
        type: Number,
        required: true
    },
    twitter: {
        type: String,
        required: false
    },
    language: {
        type: String,
        required: true,
        default: 'en'
    },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Agent = mongoose.model<AgentDocument>('ai_agents', agentSchema);

export interface IAgentVoicePreview {
    _id: Types.ObjectId;
    agentId: string;
    text: string;
    createdAt: Date;
}

export interface AgentVoicePreviewDocument extends Omit<IAgentVoicePreview, '_id'>, Document {}

const agentVoicePreviewSchema = new Schema<AgentVoicePreviewDocument>({
    agentId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const AgentVoicePreview = mongoose.model<AgentVoicePreviewDocument>('ai_agents_voice_previews', agentVoicePreviewSchema);