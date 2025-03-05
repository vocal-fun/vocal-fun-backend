import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentConfig extends Document {
  agent: string;
  systemPrompt: string;
  voiceSampleUrl: string;
  cartesiaVoiceId: string;
  language: string;
  elevenLabsVoiceId: string;

  llmModel: string;
  sttModel: string;
  ttsModel: string;
  rate: number;
}

// add timestamp to the schema
const AgentConfigSchema = new Schema({
  agent: { type: Schema.Types.ObjectId, ref: 'agents', required: true },
  systemPrompt: { type: String, required: true },
  voiceSampleUrl: { type: String, required: true },
  cartesiaVoiceId: { type: String, required: false },
  language: { type: String, required: false, default: 'en' },
  elevenLabsVoiceId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  llmModel: { type: String, required: false },
  sttModel: { type: String, required: false },
  ttsModel: { type: String, required: false },
  rate: { type: Number, required: false, default: 1 }
}, {
  timestamps: true
});

export default mongoose.model<IAgentConfig>('agent_configs', AgentConfigSchema); 