import LaunchpadAgent, { ILaunchpadAgent } from '../../models/launchpad/agent';
import AgentConfig from '../../models/launchpad/agentConfig';
import { uploadFile } from './storage';
import { SortOrder } from 'mongoose';
import Comment from '../../models/launchpad/comment';
import Trade from '../../models/launchpad/trade';
import Holder from '../../models/launchpad/holder';
import { User } from '../../models/user';
import { Types } from 'mongoose';
import { Agent } from '../../models/agent';

export type SortOption = 'newest' | 'marketCap';

interface Comment {
  id: string;
  content: string;
  userId: string;
  agentId: string;
  createdAt: Date;
}

interface Trade {
  id: string;
  agentId: string;
  amount: number;
  price: number;
  buyerId: string;
  sellerId: string;
  timestamp: Date;
}

interface TokenHolder {
  userId: string;
  agentId: string;
  balance: number;
  percentage: number;
}

interface UserDetails {
  id: string;
  username: string;
  createdAt: Date;
  stats: {
    agentsCreated: number;
    tokensHeld: number;
  };
}

export class LaunchpadAgentService {
  async createAgent(data: {
    name: string;
    symbol: string;
    description: string;
    image: Express.Multer.File;
    voiceSample: Express.Multer.File;
    systemPrompt: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    tokenAddress: string;
    userId: string;
  }) {
    const imageUrl = await uploadFile(data.image, 'agent-images');
    const voiceSampleUrl = await uploadFile(data.voiceSample, 'voice-samples');

    // random token address for now
    const tokenAddress = '0x' + Math.random().toString(16).slice(2, 42);

    const agent = await LaunchpadAgent.create({
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      imageUrl,
      createdBy: data.userId,
      website: data.website,
      twitter: data.twitter,
      telegram: data.telegram,
      tokenAddress: tokenAddress,
    });

    await AgentConfig.create({
      agentId: agent._id,
      systemPrompt: data.systemPrompt,
      voiceSampleUrl,
      llmModel: 'llama3.2',
      sttModel: 'whisper',
      ttsModel: 'xtts_v2'
    });

    return agent;
  }

  async getAgents(page = 1, limit = 20, sortBy: SortOption = 'newest') {
    const sortOptions: Record<SortOption, { [key: string]: SortOrder }> = {
      newest: { createdAt: 'desc' },
      marketCap: { marketCap: 'desc' }
    };

    const agents = await LaunchpadAgent.find()
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'address');
    

    return agents;
  }

  async getAgentByTokenAddress(tokenAddress: string) {
    return LaunchpadAgent.findOne({ tokenAddress: tokenAddress })
      .populate('createdBy', 'address');
  }

  async getAgentsByMarketCap(page = 1, limit = 20) {
    return this.getAgents(page, limit, 'marketCap');
  }

  async getLatestAgents(page = 1, limit = 20) {
    return this.getAgents(page, limit, 'newest');
  }

  async getAgentById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const agent = await LaunchpadAgent.findById(id)
      .populate('createdBy', 'address')
      .lean();

    if (!agent) {
      return null;
    }

    // Get additional stats
    const [holdersCount, totalTrades] = await Promise.all([
      Holder.countDocuments({ agent: id }),
      Trade.countDocuments({ agent: id })
    ]);

    return {
      ...agent,
      stats: {
        holdersCount,
        totalTrades
      }
    };
  }

  async getAgentComments(agentId: string, page: number, limit: number) {
    if (!Types.ObjectId.isValid(agentId)) {
      return { comments: [], total: 0 };
    }

    console.log(agentId);
    const [comments, total] = await Promise.all([
      Comment.find({ agent: agentId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', 'address')
        .lean(),
      Comment.countDocuments({ agent: agentId })
    ]);

    return { comments, total };
  }

  async addComment(agentId: string, userId: string, content: string): Promise<Comment> {
    if (!content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    if (!Types.ObjectId.isValid(agentId)) {
      throw new Error('Invalid agent ID');
    }

    const agent = await LaunchpadAgent.findById(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const comment = await Comment.create({
      content: content.trim(),
      createdBy: userId,
      agent: agentId,
      createdAt: new Date()
    });

    return comment.populate('createdBy', 'address');
  }

  async getTokenHolders(agentId: string, page: number, limit: number): Promise<{ holders: any[], total: number }> {
    if (!Types.ObjectId.isValid(agentId)) {
      return { holders: [], total: 0 };
    }

    const [holders, total] = await Promise.all([
      Holder.find({ agent: agentId })
        .sort({ balance: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'address')
        .lean(),
      Holder.countDocuments({ agent: agentId })
    ]);

    return { holders, total };
  }

  async getAgentTrades(agentId: string, page: number, limit: number): Promise<{ trades: any[], total: number }> {
    if (!Types.ObjectId.isValid(agentId)) {
      return { trades: [], total: 0 };
    }

    const [trades, total] = await Promise.all([
      Trade.find({ agent: agentId })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('buyer', 'address')
        .populate('seller', 'address')
        .lean(),
      Trade.countDocuments({ agent: agentId })
    ]);

    return { trades, total };
  }

  async getUserDetails(userId: string): Promise<UserDetails> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    const [agentsCreated, tokensHeld] = await Promise.all([
      LaunchpadAgent.countDocuments({ createdBy: userId }),
      Holder.countDocuments({ userId })
    ]);

    return {
      id: user._id.toString(),
      username: user.address,
      createdAt: user.createdAt,
      stats: {
        agentsCreated,
        tokensHeld
      }
    };
  }

  async getUserCreatedAgents(userId: string, page: number, limit: number) {
    if (!Types.ObjectId.isValid(userId)) {
      return { agents: [], total: 0 };
    }

    const [agents, total] = await Promise.all([
      LaunchpadAgent.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', 'address')
        .lean(),
      LaunchpadAgent.countDocuments({ createdBy: userId })
    ]);

    return { agents, total };
  }



  ///////////////////////
  // TEST DATA
  ///////////////////////

  async insertTestData(agentId: string, numTrades = 10, numHolders = 5) {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new Error('Invalid agent ID');
    }

    const agent = await LaunchpadAgent.findById(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

   // pick random users from the database
   const testUsers = await User.find().limit(5);

    // Insert random trades
    const trades = await Promise.all(
      Array(numTrades).fill(0).map(async (_, i) => {
        const buyerIndex = Math.floor(Math.random() * testUsers.length);
        let sellerIndex;
        do {
          sellerIndex = Math.floor(Math.random() * testUsers.length);
        } while (sellerIndex === buyerIndex);

        return Trade.create({
          agent: agentId,
          amount: Math.floor(Math.random() * 1000) + 1,
          price: parseFloat((Math.random() * 0.1).toFixed(6)),
          buyer: testUsers[buyerIndex]._id,
          seller: testUsers[sellerIndex]._id,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          txHash: '0x' + Math.random().toString(16).slice(2, 42)
        });
      })
    );

    // Insert random holders
    const totalSupply = 1000000000; // 1B tokens
    let remainingPercentage = 100;
    
    const holders = await Promise.all(
      Array(numHolders).fill(0).map(async (_, i) => {
        const isLast = i === numHolders - 1;
        const percentage = isLast ? remainingPercentage : Math.min(remainingPercentage, Math.floor(Math.random() * 30) + 1);
        remainingPercentage -= percentage;
        
        const balance = Math.floor((totalSupply * percentage) / 100);
        
        return Holder.create({
          agent: agentId,
          user: testUsers[i % testUsers.length]._id,
          balance,
          percentage
        });
      })
    );

    return {
      message: 'Test data inserted successfully',
      trades: trades.length,
      holders: holders.length
    };
  }

  async insertExistingAgents() {
    let agents = await Agent.find();
    // create a launchpad agent for each agent with the same id
    for (let agent of agents) {
      await LaunchpadAgent.create({
        _id: agent._id,
        name: agent.name,
        actualName: agent.actualName,
        symbol: agent.name.replace(/ /g, '').toLowerCase()  ,
        description: agent.actualName,
        imageUrl: agent.image,
        createdBy: '67988933ad4a03e1d12fa187',
        website: '',
        twitter: '',
        telegram: '',
        marketCap: '5000',
        currentPrice: '0',
        totalSupply: '1000000000000000000000000',
        featured: true,
        tokenAddress: '0x' + Math.random().toString(16).slice(2, 42)
      });
    }
  }

} 