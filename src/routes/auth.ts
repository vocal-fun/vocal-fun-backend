import { Router } from 'express';
import { AuthService } from '@/services/authService';
import { validate } from '@/middleware/validate';
import { nonceSchema, verifySchema } from '@/schemas/auth.schema';

export const router = Router();

router.post('/nonce', validate(nonceSchema), async (req, res) => {
  try {
    const { address } = req.body;
    const nonce = await AuthService.generateNonce(address);
    const message = `Sign this message to authenticate: ${nonce}`;

    res.json({ message, nonce });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify', validate(verifySchema), async (req, res) => {
  try {
    const { address, signature, nonce } = req.body;
    
    const result = await AuthService.verifyAuthentication(address, signature, nonce);
    if (!result) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});