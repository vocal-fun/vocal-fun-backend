import { z } from 'zod';

export const nonceSchema = z.object({
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  }),
});

export const verifySchema = z.object({
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    signature: z.string(),
    nonce: z.string(),
  }),
});

export const exchangeTokenSchema = z.object({
  body: z.object({
    token: z.string(),
    provider: z.enum(['glip']),
  }),
});