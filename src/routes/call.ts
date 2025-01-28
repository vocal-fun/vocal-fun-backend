import { startCall } from '../services/callService';
import { authMiddleware } from '../middleware/auth';
import { getAgentPreviewVoiceline, getAllAgents } from '../services/agentsService';
import { Router } from 'express';

export const router = Router();

router.use(authMiddleware);

router.post('/start', async (req: any, res) => {
  try {
    let user = req.user;
    let agentId = req.query.agentId as string;
    let session = await startCall(user._id.toString(), agentId);
    let result = { session: session, sessionId: session._id.toString() };
    
    res.json(result);
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});