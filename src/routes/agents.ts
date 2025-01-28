import { getAllAgents } from '../services/agentsService';
import { Router } from 'express';

export const router = Router();

router.get('/', async (req, res) => {
  try {
   let result = await getAllAgents();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});