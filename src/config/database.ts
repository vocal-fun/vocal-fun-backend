import mongoose from 'mongoose';
import { config } from '../config';
import { insertAgentVoicePreviews, insertAgents } from '../utils/insertAgents';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};