import { describe, it, expect } from 'vitest';
import { parseSpectralEvent } from '../src/parsers/spectralEvents';
import { xdr, nativeToScVal } from '@stellar/stellar-sdk';

describe('Spectral Event Parser', () => {
  it('should parse a vault created event', () => {
    const vaultId = '0'.repeat(64);
    const event = {
      type: 'contract',
      contractId: 'CA...',
      ledger: 100,
      txHash: 'abc',
      topic: [
        nativeToScVal('vault').toXDR('base64'),
        nativeToScVal('created').toXDR('base64'),
        nativeToScVal(vaultId).toXDR('base64'),
      ],
      value: nativeToScVal('manager_address').toXDR('base64'),
    };

    const parsed = parseSpectralEvent(event);
    expect(parsed).toBeDefined();
    expect(parsed?.type).toBe('created');
    expect(parsed?.vaultId).toBe(vaultId);
    expect(parsed?.data).toBe('manager_address');
  });

  it('should return null for non-vault events', () => {
    const event = {
      topic: [nativeToScVal('other').toXDR('base64')],
      value: nativeToScVal(123).toXDR('base64'),
    };
    expect(parseSpectralEvent(event)).toBeNull();
  });
});
