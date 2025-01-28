import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAgent {
    _id: Types.ObjectId;
    name: string;
    image: string;
    createdAt: Date;
    twitter: string;
    rate: number;
}

export interface AgentDocument extends Omit<IAgent, '_id'>, Document {}

const agentSchema = new Schema<AgentDocument>({
    name: {
        type: String,
        required: true,
        unique: false
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Agent = mongoose.model<AgentDocument>('ai_agents', agentSchema);