import jwt from 'jsonwebtoken';
import { IUser, User } from '@/models/user';
import { config } from '@/config';
import { redis } from '@/config/redis';
import crypto from 'crypto';
import { verifySignature } from '@/utils/web3utils';

export class AuthService {
  private static NONCE_EXPIRATION = 300; // 5 minutes

  static async generateNonce(address: string): Promise<string> {
    const nonce = crypto.randomBytes(32).toString('hex');
    const key = `nonce:${address.toLowerCase()}`;
    
    await redis.setex(key, this.NONCE_EXPIRATION, nonce);
    return nonce;
  }

  static async verifyNonce(address: string, nonce: string): Promise<boolean> {
    const key = `nonce:${address.toLowerCase()}`;
    const storedNonce = await redis.get(key);
    
    if (!storedNonce || storedNonce !== nonce) {
      return false;
    }
    
    await redis.del(key);
    return true;
  }

  static async findOrCreateUser(address: string): Promise<IUser> {
    const lowercaseAddress = address.toLowerCase();
    let user = await User.findOne({ address: lowercaseAddress });
    
    if (!user) {
      user = await User.create({ address: lowercaseAddress });
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
    if (!isNonceValid) {
      return null;
    }

    // Verify signature
    const message = `Sign this message to authenticate: ${nonce}`;
    const isSignatureValid = verifySignature(message, signature, address);
    if (!isSignatureValid) {
      return null;
    }

    // Find or create user
    const user = await this.findOrCreateUser(address);
    const token = this.generateToken(user);

    return { user, token };
  }
}