import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentConfig extends Document {
  agentId: string;
  systemPrompt: string;
  voiceSampleUrl: string;
}

const AgentConfigSchema = new Schema({
  agentId: { type: Schema.Types.ObjectId, ref: 'agents', required: true },
  systemPrompt: { type: String, required: true },
  voiceSampleUrl: { type: String, required: true }
});

export default mongoose.model<IAgentConfig>('agent_config', AgentConfigSchema); 