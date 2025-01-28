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
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    if (!decoded) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
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
      res.status(401).json({ message: 'Authentication required' });
      return;
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