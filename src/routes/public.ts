import { Router } from 'express';

export const router = Router();

router.get('/info', (req, res) => {
  res.json({ message: 'Public API endpoint' });
});