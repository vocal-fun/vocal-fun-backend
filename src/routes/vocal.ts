import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUserProfile } from '../services/userService';
import { getBuyCredits } from '../services/vocalService';

export const router = Router();

router.get('/buy-credits', async (req: any, res) => {
  let user = await getBuyCredits()
  res.json(user);
});

