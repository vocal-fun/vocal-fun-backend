import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICallSession {
    _id: Types.ObjectId;
    userId: string;
    agentId: string;
    createdAt: Date;
    callStartTime: Date;
    callEndTime: Date;
    status: string;
    numConversations: number;
}

export interface CallSessionDocument extends Omit<ICallSession, '_id'>, Document {}

const callSessionSchema = new Schema<CallSessionDocument>({
    userId: {
        type: String,
        required: true
    },
    agentId: {
        type: String,
        required: true
    },
    callStartTime: {
        type: Date,
        required: false
    },
    callEndTime: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        required: true
    },
    numConversations: {
        type: Number,
        required: false
    },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const CallSession = mongoose.model<CallSessionDocument>('call_sessions', callSessionSchema);