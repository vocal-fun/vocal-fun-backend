import mongoose, { Schema, Document } from 'mongoose';

export interface IHolder extends Document {
  user: string;
  agent: string;
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

HolderSchema.index({ agent: 1, balance: -1 });
HolderSchema.index({ user: 1, agent: 1 }, { unique: true });

export default mongoose.model<IHolder>('holders', HolderSchema); 