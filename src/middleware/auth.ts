import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/user';

export const authMiddleware = async (
  req: any,
  res: any,
  next: NextFunction
): Promise<void> => {
  try {
    // Get full authorization header
    const authHeader = req.headers.authorization;
    // console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid Authorization header found');
      res.status(401).json({ message: 'No valid Authorization header found' });
      return;
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    // console.log('Extracted token:', token);
    
    if (!token) {
      console.log('No token found after Bearer');
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      // console.log('Decoded token:', decoded);

      const user = await User.findById(decoded.userId);
      
      if (!user) {
        // console.log('User not found:', decoded.userId);
        res.status(401).json({ message: 'User not found' });
        return;
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError);
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const optionalAuthMiddleware = async (
  req: any,
  res: any,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      next();
      return
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    if (!decoded) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    const user = await User.findById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const decodeJwt = async (token: string) => {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    if (!decoded) {
        return null;
    }
    const user = await User.findById(decoded.userId);
    return user;
}