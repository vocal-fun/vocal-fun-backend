import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRATION || '24h'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vocal'
  },
  redis: {
    uri: process.env.REDIS_URI || 'redis://localhost:6379'
  },
  glip: {
    exchangeTokenUrl: process.env.GLIP_EXCHANGE_TOKEN_URL,
    apiKey: process.env.GLIP_X_API_KEY,
  }
} as const;