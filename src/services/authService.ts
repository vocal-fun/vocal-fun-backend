import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/user';
import { config } from '../config';
import { redis } from '../config/redis';
import crypto from 'crypto';
import { verifySignature } from '../utils/web3utils';

export class AuthService {
  private static NONCE_EXPIRATION = 300; // 5 minutes

  static async generateNonce(address: string): Promise<string> {
    const nonce = crypto.randomBytes(8).toString('hex');
    const key = `vocal:nonce:${address.toLowerCase()}`;
    
    await redis.setex(key, this.NONCE_EXPIRATION, nonce);
    return nonce;
  }

  static async verifyNonce(address: string, nonce: string): Promise<boolean> {
    const key = `vocal:nonce:${address.toLowerCase()}`;
    const storedNonce = await redis.get(key);
    
    if (!storedNonce || storedNonce !== nonce) {
      return false;
    }
    
    await redis.del(key);
    return true;
  }

  static async findOrCreateUser(address: string, initialBalance: number = 10, provider: string = ""): Promise<IUser> {
    const lowercaseAddress = address.toLowerCase();
    let user = await User.findOne({ address: lowercaseAddress });
    
    if (!user) {
      user = await User.create({ address: lowercaseAddress, balance: initialBalance, provider: provider });
    }
    
    return user;
  }

  static generateToken(user: IUser): string {
    return jwt.sign(
      { userId: user._id, address: user.address },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  static async verifyAuthentication(
    address: string,
    signature: string,
    nonce: string
  ): Promise<{ user: IUser; token: string } | null> {
    // Verify nonce
    const isNonceValid = await this.verifyNonce(address, nonce);
    console.log(isNonceValid);
    if (!isNonceValid) {
      return null;
    }

    // Verify signature
    const message = `You are logging in to Vocal.fun, sign this message to authenticate: ${nonce}`;
    const isSignatureValid = verifySignature(message, signature, address);
    if (!isSignatureValid) {
      return null;
    }

    // Find or create user
    const user = await this.findOrCreateUser(address, 10);
    const token = this.generateToken(user);

    return { user, token };
  }

  static async exchangeToken(thirdPartyToken: string, provider: string): Promise<{ user: IUser; token: string } | null> {
    if (provider == 'glip') {
      const response = await fetch(`${config.glip.glipProviderUrl!}/exchange-vocal-token`, {
        method: 'POST',
        body: JSON.stringify({ token: thirdPartyToken }),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.glip.apiKey!,
        },
      });
      const data: any = await response.json();
      const glipData = data.data; 
      const user = await this.findOrCreateUser(glipData.address, 0, provider);
      const token = this.generateToken(user);

      return { user, token };
    }
    throw new Error('Unsupported provider');
   
  }
}