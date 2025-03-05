import { Router, Request as ExpressRequest } from 'express';
import multer from 'multer';
import { LaunchpadAgentService, SortOption } from '../../services/launchpad/agent';
import { authMiddleware } from '../../middleware/auth';

// Define a custom Request interface
interface Request extends ExpressRequest {
  user?: {
    id: string;
    // Add other user properties as needed
  }
}

export const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const launchpadService = new LaunchpadAgentService();

router.get('/config', (req, res) => {
  res.json({
    createAgentFees: '0.02',
    chainId: 8453,
  });
});

router.get('/agents', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'newest' 
    } = req.query;

    // Validate sort parameter
    const validSortOptions = ['newest', 'marketCap'];
    const sortBy = validSortOptions.includes(sort as string) 
      ? sort as SortOption 
      : 'newest';

    const agents = await launchpadService.getAgents(
      Number(page), 
      Number(limit), 
      sortBy
    );

    res.json({
      agents,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch agents',
      message: (error as Error).message 
    });
  }
});

// Convenience endpoints for specific sorts
router.get('/agents/top', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const agents = await launchpadService.getAgentsByMarketCap(
      Number(page), 
      Number(limit)
    );
    res.json({
      agents,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch top agents',
      message: (error as Error).message 
    });
  }
});

router.get('/agents/latest', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const agents = await launchpadService.getLatestAgents(
      Number(page), 
      Number(limit)
    );
    res.json({
      agents,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch latest agents',
      message: (error as Error).message 
    });
  }
});


// Get agent details by ID
router.get('/agent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await launchpadService.getAgentById(id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agent);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch agent details',
      message: (error as Error).message 
    });
  }
});

// Get comments for an agent
router.get('/comments/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const comments = await launchpadService.getAgentComments(
      agentId,
      Number(page),
      Number(limit)
    );
    
    res.json({
      comments,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      message: (error as Error).message 
    });
  }
});


// Get token holders for an agent
router.get('/holders/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const holders = await launchpadService.getTokenHolders(
      agentId,
      Number(page),
      Number(limit)
    );
    
    res.json({
      holders,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch token holders',
      message: (error as Error).message 
    });
  }
});

// Get recent trades for an agent
router.get('/trades/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const trades = await launchpadService.getAgentTrades(
      agentId,
      Number(page),
      Number(limit)
    );
    
    res.json({
      trades,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch trades',
      message: (error as Error).message 
    });
  }
});

// Get user details including their created tokens
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const userDetails = await launchpadService.getUserDetails(userId);
    const userAgents = await launchpadService.getUserCreatedAgents(
      userId,
      Number(page),
      Number(limit)
    );
    
    res.json({
      user: userDetails,
      agents: userAgents,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch user details',
      message: (error as Error).message 
    });
  }
});


// Protected routes
router.use(authMiddleware);

router.post('/create', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'voiceSample', maxCount: 1 }
  ]),
  async (req: Request, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const agent = await launchpadService.createAgent({
      name: req.body.name,
      symbol: req.body.symbol,
      description: req.body.description,
      systemPrompt: req.body.systemPrompt,
      twitter: req.body.twitter,
      website: req.body.website,
      telegram: req.body.telegram,
      tokenAddress: req.body.tokenAddress,
      userId: req.user!.id,
      image: files.image[0],
      voiceSample: files.voiceSample[0],
    });
    
    res.json(agent);
});

// Add a comment to an agent
router.post('/comments/:agentId', async (req: Request, res) => {
  try {
    const { agentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;
    
    const comment = await launchpadService.addComment(agentId, userId, content);
    res.json(comment);
  } catch (error) {
    console.log('Error adding comment', error);
    res.status(500).json({ 
      error: 'Failed to add comment',
      message: (error as Error).message 
    });
  }
});

export default router; 