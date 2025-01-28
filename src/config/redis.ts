import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis.uri);

redis.on('error', (error: Error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Redis connected');
});