import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICreditTransaction {
    _id: Types.ObjectId;
    userId: string;
    userAddress: string;
    creditAmount: number;
    txHash: string;
    txAmount: number;
    tokenAddress: string;
    network: string;
    provider: string;
    createdAt: Date;
}

export interface CreditTransactionDocument extends Omit<ICreditTransaction, '_id'>, Document {}

const creditTransactionSchema = new Schema<CreditTransactionDocument>({
    userId: {
        type: String,
        required: true
    },
    userAddress: {
        type: String,
        required: true
    },
    creditAmount: {
        type: Number,
        required: false
    },
    txHash: {
        type: String,
        required: false
    },
    txAmount: {
        type: Number,
        required: false
    },
    tokenAddress: {
        type: String,
        required: false
    },
    network: {
        type: String,
        required: false
    },
    provider: {
        type: String,
        required: false
    },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const CreditTransaction = mongoose.model<CreditTransactionDocument>('vocal_credit_txs', creditTransactionSchema);