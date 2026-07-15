import { describe, it, expect } from 'vitest';
import { parseEnv } from '../src/config/env';

describe('Environment Configuration Validation', () => {
  const baseValidEnv = {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test?schema=public',
    PORT: '3000',
    SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
    NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
    NETWORK_NAME: 'testnet',
    SPECTRAL_CONTRACT_IDS: 'CA123456789012345678901234567890123456789012345678901234',
    START_LEDGER: '100',
    BATCH_SIZE: '10',
    POLLING_INTERVAL: '1000',
    LOG_LEVEL: 'debug',
  };

  it('should validate a correct configuration and parse types', () => {
    const result = parseEnv(baseValidEnv);
    expect(result).toBeDefined();
    expect(result.PORT).toBe(3000);
    expect(result.START_LEDGER).toBe(100);
    expect(result.BATCH_SIZE).toBe(10);
    expect(result.POLLING_INTERVAL).toBe(1000);
    expect(result.SPECTRAL_CONTRACT_IDS).toEqual([
      'CA123456789012345678901234567890123456789012345678901234',
    ]);
  });

  it('should fall back to default values for optional environment variables', () => {
    const minimalEnv = {
      DATABASE_URL: 'postgresql://localhost:5432',
      SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
      NETWORK_PASSPHRASE: 'Test network passphrase',
      NETWORK_NAME: 'testnet',
      SPECTRAL_CONTRACT_IDS: 'CA123456789012345678901234567890123456789012345678901234',
    };
    const result = parseEnv(minimalEnv);
    expect(result.PORT).toBe(3000); // default
    expect(result.START_LEDGER).toBe(0); // default
    expect(result.BATCH_SIZE).toBe(50); // default
    expect(result.POLLING_INTERVAL).toBe(5000); // default
    expect(result.LOG_LEVEL).toBe('info'); // default
  });

  it('should split comma-separated contract IDs and clean whitespaces', () => {
    const env = {
      ...baseValidEnv,
      SPECTRAL_CONTRACT_IDS: ' CA1, CA2 , CA3  ',
    };
    const result = parseEnv(env);
    expect(result.SPECTRAL_CONTRACT_IDS).toEqual(['CA1', 'CA2', 'CA3']);
  });

  it('should fail validation if SOROBAN_RPC_URL is missing', () => {
    const env = { ...baseValidEnv };
    delete (env as any).SOROBAN_RPC_URL;
    expect(() => parseEnv(env)).toThrow(/SOROBAN_RPC_URL/);
  });

  it('should fail validation if SOROBAN_RPC_URL is not a valid URL', () => {
    const env = { ...baseValidEnv, SOROBAN_RPC_URL: 'not-a-url' };
    expect(() => parseEnv(env)).toThrow(/SOROBAN_RPC_URL/);
  });

  it('should fail validation if SPECTRAL_CONTRACT_IDS is missing', () => {
    const env = { ...baseValidEnv };
    delete (env as any).SPECTRAL_CONTRACT_IDS;
    expect(() => parseEnv(env)).toThrow(/SPECTRAL_CONTRACT_IDS/);
  });

  it('should fail validation if SPECTRAL_CONTRACT_IDS is empty', () => {
    const env = { ...baseValidEnv, SPECTRAL_CONTRACT_IDS: '' };
    expect(() => parseEnv(env)).toThrow(/SPECTRAL_CONTRACT_IDS/);
  });

  it('should fail validation if SPECTRAL_CONTRACT_IDS contains only placeholders', () => {
    const env = { ...baseValidEnv, SPECTRAL_CONTRACT_IDS: 'CA..., placeholder, PLACEHOLDER' };
    expect(() => parseEnv(env)).toThrow(/SPECTRAL_CONTRACT_IDS/);
  });

  it('should fail validation if DATABASE_URL is missing', () => {
    const env = { ...baseValidEnv };
    delete (env as any).DATABASE_URL;
    expect(() => parseEnv(env)).toThrow(/DATABASE_URL/);
  });

  it('should fail validation if PORT is not a number', () => {
    const env = { ...baseValidEnv, PORT: 'abc' };
    expect(() => parseEnv(env)).toThrow(/PORT/);
  });

  it('should fail validation if START_LEDGER is negative', () => {
    const env = { ...baseValidEnv, START_LEDGER: '-5' };
    expect(() => parseEnv(env)).toThrow(/START_LEDGER/);
  });
});
