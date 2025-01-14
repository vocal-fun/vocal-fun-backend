import { ethers } from 'ethers';

export const verifySignature = (
  message: string,
  signature: string,
  address: string
): boolean => {
  try {
    const signerAddr = ethers.verifyMessage(message, signature);
    return signerAddr.toLowerCase() === address.toLowerCase();
  } catch (error) {
    return false;
  }
};