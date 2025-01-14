import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser {
    _id: Types.ObjectId;
    address: string;
    createdAt: Date;
}

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<UserDocument>({
  address: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model<UserDocument>('users', userSchema);