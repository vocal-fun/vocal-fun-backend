import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';

export const router = Router();

router.use(authMiddleware);

router.get('/profile', (req, res) => {
  res.json({ user: req.user });
});