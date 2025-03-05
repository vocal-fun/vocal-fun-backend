import mongoose from 'mongoose';
import { config } from '../config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
