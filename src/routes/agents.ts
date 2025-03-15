import { getAgentPreviewVoiceline, getAgentsFromTags, getAllAgents } from '../services/agentsService';
import { Router } from 'express';

export const router = Router();

router.get('/', async (req, res) => {
  try {
    let tag = req.query.tag as string;
    let result
    if (tag) {
      result = await getAgentsFromTags(tag);
    } else {
      result = await getAllAgents();
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/preview', async (req, res) => {
  try {
    let agentId = req.query.agentId as string;
   let result = await getAgentPreviewVoiceline(agentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});