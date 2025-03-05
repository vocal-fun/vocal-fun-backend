import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  agentId: string;
  amount: number;
  price: number;
  buyerId: string;
  sellerId: string;
  timestamp: Date;
  txHash: string;
}

const TradeSchema = new Schema({
  agent: { type: Schema.Types.ObjectId, ref: 'agents', required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  buyer: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  seller: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  timestamp: { type: Date, default: Date.now },
  txHash: { type: String, required: true, unique: true }
});

TradeSchema.index({ agentId: 1, timestamp: -1 });
export default mongoose.model<ITrade>('trades', TradeSchema); 