import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUserProfile } from '../services/userService';

export const router = Router();

router.use(authMiddleware);

router.get('/', async (req: any, res) => {
  let user = await getUserProfile(req.user.address)
  res.json({ user: user });
});