import { xdr, scValToNative } from '@stellar/stellar-sdk';

export function parseSpectralEvent(event: any) {
  const topics = event.topic.map((t: string) => scValToNative(xdr.ScVal.fromXDR(t, 'base64')));
  const data = scValToNative(xdr.ScVal.fromXDR(event.value, 'base64'));

  if (topics[0] !== 'vault') {
    return null;
  }

  return {
    type: topics[1],
    vaultId: topics[2],
    data,
    ledger: event.ledger,
    txHash: event.txHash,
    id: event.id,
  };
}
