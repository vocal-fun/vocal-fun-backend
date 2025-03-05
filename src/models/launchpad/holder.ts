import mongoose, { Schema, Document } from 'mongoose';

export interface IHolder extends Document {
  userId: string;
  agentId: string;
  balance: number;
  percentage: number;
  lastUpdated: Date;
}

const HolderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  agent: { type: Schema.Types.ObjectId, ref: 'agents', required: true },
  balance: { type: Number, required: true, default: 0 },
  percentage: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

HolderSchema.index({ agentId: 1, balance: -1 });
HolderSchema.index({ userId: 1, agentId: 1 }, { unique: true });

export default mongoose.model<IHolder>('holders', HolderSchema); 