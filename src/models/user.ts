import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser {
    _id: Types.ObjectId;
    address: string;
    balance: number;
    createdAt: Date;
}

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<UserDocument>({
  address: {
    type: String,
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model<UserDocument>('users', userSchema);