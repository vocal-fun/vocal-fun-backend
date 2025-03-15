import { CreditTransaction } from '../models/vocal';
import { ethers, WebSocketProvider, BigNumberish, formatUnits, Contract } from 'ethers';
import { getUserById, getUserProfile } from './userService';
import { User } from '../models/user';
import { sendUserSocketMessage } from '../socket';
import dotenv from 'dotenv';
import { config } from '../config';

dotenv.config();

interface PaymentMethod {
    name: string;
    symbol: string;
    address: string;
    network: string;
    recipient: string;
}

interface TransferEvent {
    from: string;
    to: string;
    value: BigNumberish;
    transactionHash: string;
}

export const CONSTANTS = {
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT_ADDRESS: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    EVM_RECEIVER_ADDRESS: '0x16b1025cD1A83141bf93E47dBC316f34f27f2e76',
    CREDIT_PURCHASE_RATE: 1, // 1 token for 1 min
    NETWORK: 'base',
    TOKEN_DECIMALS: 6,
    ALCHEMY_WS_URL: process.env.RPC_URL || '',
    // Transfer event signature: keccak256("Transfer(address,address,uint256)")
    TRANSFER_EVENT_SIGNATURE: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
} as const;

const SUPPORTED_TOKENS = ['USDC', 'USDT'] as const;
type SupportedToken = typeof SUPPORTED_TOKENS[number];

export const getBuyCredits = async (): Promise<{ paymentMethods: PaymentMethod[] }> => {
    return {
        paymentMethods: [
            {
                name: 'USDC',
                symbol: 'USDC',
                address: CONSTANTS.USDC_ADDRESS,
                network: CONSTANTS.NETWORK,
                recipient: CONSTANTS.EVM_RECEIVER_ADDRESS
            },
            {
                name: 'USDT',
                symbol: 'USDT',
                address: CONSTANTS.USDT_ADDRESS,
                network: CONSTANTS.NETWORK,
                recipient: CONSTANTS.EVM_RECEIVER_ADDRESS
            }
        ]
    };
};

const calculateCreditAmount = (tokenAmount: number): number => {
    const creditAmount = tokenAmount * CONSTANTS.CREDIT_PURCHASE_RATE;
    return Math.round(creditAmount * 100) / 100;
};

const processTransaction = async (
    token: SupportedToken,
    from: string,
    value: string,
    txHash: string
): Promise<void> => {
    try {
        console.log(`Processing ${token} credit purchase for user ${from}...`);
        const existingTx = await CreditTransaction.findOne({ 
            txHash: txHash.toLowerCase() 
        });
        
        if (existingTx) {
            console.log(`Transaction ${txHash} already processed`);
            return;
        }

        const tokenAmount = parseFloat(value);
        const creditAmount = calculateCreditAmount(tokenAmount);

        const user = await getUserProfile(from);
        if (!user) {
            console.error(`User not found for address ${from}`);
            return;
        }

        const newCredit = new CreditTransaction({
            userId: user._id.toString(),
            userAddress: from,
            creditAmount,
            txHash,
            txAmount: tokenAmount,
            tokenAddress: token,
            network: CONSTANTS.NETWORK,
        });
        await newCredit.save()

        await User.updateOne(
            { _id: user._id },
            { $inc: { balance: creditAmount } }
        );

        let newUser = await getUserProfile(from);

        console.log(`Successfully processed ${token} credit purchase for user ${from}`);

        sendUserSocketMessage(user.address, 'balance_update', { balance: newUser?.balance });

    } catch (error) {
        console.error('Error processing credit transaction:', error);
        throw error;
    }
};

const setupTokenFilter = (tokenAddress: string) => ({
    address: tokenAddress,
    topics: [
        CONSTANTS.TRANSFER_EVENT_SIGNATURE,
        null, // from address (any)
        ethers.zeroPadValue(CONSTANTS.EVM_RECEIVER_ADDRESS.toLowerCase(), 32) // to address (padded)
    ]
});

export const vocalCreditListener = async (): Promise<void> => {
    try {
        console.log('Starting Vocal credit listener...');
        
        const provider = new WebSocketProvider(CONSTANTS.ALCHEMY_WS_URL);
        
        provider.on('error', (error) => {
            console.error('WebSocket provider error:', error);
            // Implement reconnection logic here
        });

        // Setup filters for each token
        const filters = {
            USDC: setupTokenFilter(CONSTANTS.USDC_ADDRESS),
            USDT: setupTokenFilter(CONSTANTS.USDT_ADDRESS)
        };

        provider.on(filters.USDC, async (log) => {
            try {
                const from = ethers.dataSlice(log.topics[1], 12); // Extract address from topic
                const value = formatUnits(log.data, CONSTANTS.TOKEN_DECIMALS);
                await processTransaction('USDC', from, value, log.transactionHash);
            } catch (error) {
                console.error('Error processing USDC transfer:', error);
            }
        });

        provider.on(filters.USDT, async (log) => {
            try {
                const from = ethers.dataSlice(log.topics[1], 12); // Extract address from topic
                const value = formatUnits(log.data, CONSTANTS.TOKEN_DECIMALS);
                await processTransaction('USDT', from, value, log.transactionHash);
            } catch (error) {
                console.error('Error processing USDT transfer:', error);
            }
        });

        console.log('Watching for filtered USDC and USDT transfers on Base chain...');
    } catch (error) {
        console.error('Error initializing vocal credit listener:', error);
    }
};

export const mintVocalCredits = async (apiKey: string, address: string, amount: number, provider: string): Promise<any> => {
    try {
        let validProvider = false;
        if (provider == 'glip') {
            if (apiKey !== config.glip.apiKey) {
                throw new Error('Authentication failed');
            }
            validProvider = true;
        }
        if (!validProvider) {
            throw new Error('Invalid provider');
        }
        
        const user = await getUserById(address.toLowerCase());
        if (!user) {
            throw new Error('User not found');
        }
        const newCredit = new CreditTransaction({
                userId: user._id.toString(),
                userAddress: user.address,
                creditAmount: amount,
                txHash: '',
                txAmount: '',
                provider: provider
            });
        await newCredit.save()

        await User.updateOne(
            { _id: user._id },
            { $inc: { balance: amount } }
        );
    
        return { user };
    } catch (error) {
        console.error('Error minting vocal credits', error);
        throw error;
    }
}

export const deductUserVocalCredits = async (userId: string, amount: number): Promise<any> => {
    try {
        await User.updateOne(
            { _id: userId },
            { $inc: { balance: -amount } }
        );
        
        const updatedUser = await User.findById(userId, { balance: 1 });
        return updatedUser?.balance || 0;
    } catch (error) {
        console.error('Error updating user vocal credits', error);
        throw error;
    }
}