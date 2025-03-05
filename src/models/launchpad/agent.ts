import mongoose, { Schema, Document } from 'mongoose';

export interface ILaunchpadAgent extends Document {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  tokenAddress: string;
  createdBy: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  marketCap: number;
  currentPrice: number;
  totalSupply: number;
  createdAt: Date;
  updatedAt: Date;
}

const LaunchpadAgentSchema = new Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true, unique: false },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  tokenAddress: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  website: { type: String },
  twitter: { type: String },
  telegram: { type: String },
  marketCap: { type: String, default: '5000' },
  currentPrice: { type: String, default: '0' },
  totalSupply: { type: String, default: '1000000000000000000000000' } // 1 billion tokens
}, {
  timestamps: true
});

export default mongoose.model<ILaunchpadAgent>('agents', LaunchpadAgentSchema); 