import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  userId: string;
  agentId: string;
  createdAt: Date;
}

const CommentSchema = new Schema({
  content: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  agent: { type: Schema.Types.ObjectId, ref: 'agents', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IComment>('comments', CommentSchema); 