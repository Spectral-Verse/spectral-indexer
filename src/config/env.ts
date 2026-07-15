import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string({
    required_error: "DATABASE_URL is required",
  }).min(1, "DATABASE_URL cannot be empty"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  SOROBAN_RPC_URL: z.string({
    required_error: "SOROBAN_RPC_URL is required",
  }).url("SOROBAN_RPC_URL must be a valid URL"),
  NETWORK_PASSPHRASE: z.string({
    required_error: "NETWORK_PASSPHRASE is required",
  }).min(1, "NETWORK_PASSPHRASE cannot be empty"),
  NETWORK_NAME: z.string({
    required_error: "NETWORK_NAME is required",
  }).min(1, "NETWORK_NAME cannot be empty"),
  SPECTRAL_CONTRACT_IDS: z.string({
    required_error: "SPECTRAL_CONTRACT_IDS is required",
  })
    .transform((val) => {
      return val
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0 && id !== 'CA...' && id.toLowerCase() !== 'placeholder');
    })
    .refine((arr) => arr.length > 0, {
      message: "SPECTRAL_CONTRACT_IDS must contain at least one valid contract ID and cannot be empty or only contain placeholders",
    }),
  START_LEDGER: z.coerce.number().int().nonnegative().default(0),
  BATCH_SIZE: z.coerce.number().int().positive().default(50),
  POLLING_INTERVAL: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z.string().default('info'),
});

export const parseEnv = (envObj: Record<string, unknown>) => {
  const result = envSchema.safeParse(envObj);

  if (!result.success) {
    const errorMessages = result.error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${errorMessages}`);
  }

  return result.data;
};

export const config = process.env.NODE_ENV === 'test'
  ? {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/spectral_indexer?schema=public',
      PORT: Number(process.env.PORT) || 3000,
      SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
      NETWORK_PASSPHRASE: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
      NETWORK_NAME: process.env.NETWORK_NAME || 'testnet',
      SPECTRAL_CONTRACT_IDS: (process.env.SPECTRAL_CONTRACT_IDS || 'CA123456789012345678901234567890123456789012345678901234').split(','),
      START_LEDGER: Number(process.env.START_LEDGER) || 0,
      BATCH_SIZE: Number(process.env.BATCH_SIZE) || 50,
      POLLING_INTERVAL: Number(process.env.POLLING_INTERVAL) || 5000,
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    }
  : parseEnv(process.env);
