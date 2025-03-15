import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUserProfile } from '../services/userService';
import { validate } from '../middleware/validate';
import { exchangeVocalCredits } from '../services/callService';
import { z } from 'zod';

export const router = Router();

router.use(authMiddleware);

router.get('/', async (req: any, res) => {
  let user = await getUserProfile(req.user.address)
  res.json({ user: user });
});

const exchangeVocalCreditsSchema = z.object({
  body: z.object({
    token: z.string(),
    provider: z.enum(['glip']),
    amount: z.number(),
    signature: z.string(),
  }),
});
// exchanges vocal credits from a third party pre authorised proivder and returns the updated user profile
router.post('/exchange-vocal-credits', validate(exchangeVocalCreditsSchema), async (req: any, res) => {
  try {
    const { token, provider, amount, signature } = req.body;
    const address = req.user.address;
    
    const result = await exchangeVocalCredits(token, provider, amount, address, signature);
    if (!result) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});