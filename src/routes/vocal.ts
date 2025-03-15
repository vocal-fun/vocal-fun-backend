import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUserProfile } from '../services/userService';
import { getBuyCredits, mintVocalCredits } from '../services/vocalService';
import { validate } from '../middleware/validate';
import { z } from 'zod';

export const router = Router();

router.get('/buy-credits', async (req: any, res) => {
  let user = await getBuyCredits()
  res.json(user);
});

const mintCreditsSchema = z.object({
  body: z.object({
    address: z.string(),
    amount: z.number(),
    provider: z.enum(['glip']),
  }),
});

router.post('/mint-credits', validate(mintCreditsSchema), async (req: any, res) => {
  try {
    const { address, amount, provider } = req.body;
   let apiKey = req.headers['x-api-key'];
    let result = await mintVocalCredits(apiKey, address, amount, provider);
    if (!result) {
      return res.status(401).json({ message: 'Minting credits failed' });
    }

    res.json({ message: 'Credits minted successfully', success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});