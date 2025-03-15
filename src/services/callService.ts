import { Types } from "mongoose";
import { CallSession } from "../models/call";
import { getAgent } from "./agentsService";
import { getUserById } from "./userService";
import { config } from '../config';
import { CreditTransaction } from "../models/vocal";
import { User } from "../models/user";

export const startCall = async (userId: string, agentId: string) => {
    console.log('starting call', userId, agentId);

    let user = await getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    if (user.balance <= 0) {
        throw new Error('Insufficient balance');
    }

    let agent = await getAgent(agentId);
    if (!agent) {
        throw new Error('Agent not found');
    }
    
    const newSession = new CallSession({
        userId: user._id,
        agentId: agent._id,
        status: 'starting',
    });

    await newSession.save();

    return newSession;
}

export const getValidatedSession = async (sessionId: string) => {
    let session = await CallSession.findOne({ _id: new Types.ObjectId(sessionId) });
    if (!session) {
        console.log('Session not found', sessionId);
       return null
    }
    return session
}

export const exchangeVocalCredits = async (thirdPartyToken: string, provider: string, amount: number, address: string, signature: string): Promise<any> => {
    try {
        if (provider == 'glip') {
            const response = await fetch(`${config.glip.glipProviderUrl!}/exchange-vocal-credits`, {
              method: 'POST',
              body: JSON.stringify({ token: thirdPartyToken, amount: amount, address: address, signature: signature }),
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.glip.apiKey!,
              },
            });
            const data: any = await response.json();
            if (!data.success) {
                throw new Error('Failed to exchange credits');
            }
            const receivedAmount = data.data.amount;
            const txHash = data.data.txHash;
            const user = await getUserById(address);
            if (!user) {
              throw new Error('User not found');
            }
            const newCredit = new CreditTransaction({
                  userId: user._id.toString(),
                  userAddress: user.address,
                  creditAmount: receivedAmount,
                  txHash: txHash,
                  txAmount: receivedAmount,
                  provider: provider
              });
              await newCredit.save()
      
              await User.updateOne(
                  { _id: user._id },
                  { $inc: { balance: receivedAmount } }
              );
      
            return { user };
          }
          throw new Error('Unsupported provider');
    } catch (error) {
        console.error('Error exchanging vocal credits', error);
        throw error;
    }
}