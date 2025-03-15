import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { getUserProfile } from '../services/userService';
import { validate } from '../middleware/validate';
import { exchangeVocalCredits } from '../services/callService';
import { z } from 'zod';

export const router = Router();

router.use(optionalAuthMiddleware);

router.get('/', async (req: any, res) => {
  let address = req.query.address;
  if (!address) {
    address = req.user.address;
  }
  if (!address) {
    return res.status(401).json({ message: 'Authentication failed or address not provided' });
  }
  let user = await getUserProfile(address.toLowerCase());
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
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});