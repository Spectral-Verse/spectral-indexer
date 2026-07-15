import { SorobanRpc, xdr, scValToNative } from '@stellar/stellar-sdk';
import { logger } from '../utils/logger';

/**
 * Service for polling and retrieving contract events from the Soroban RPC.
 * 
 * This class handles the low-level communication with the Stellar network
 * to extract relevant events for the Spectral Verse protocol.
 */
export class EventFetcher {
  private server: SorobanRpc.Server;

  /**
   * Initializes the EventFetcher with a Soroban RPC server connection.
   * 
   * @param rpcUrl - The Soroban RPC endpoint URL (e.g., "https://soroban-testnet.stellar.org").
   */
  constructor(rpcUrl: string) {
    this.server = new SorobanRpc.Server(rpcUrl);
  }

  /**
   * Fetches events for a specific set of contract IDs starting from a target ledger.
   * 
   * This method uses the `getEvents` RPC method, which is the standard way to 
   * retrieve contract-emitted data in Soroban.
   * 
   * @param contractIds - Array of hexadecimal contract IDs to monitor.
   * @param startLedger - The sequence number of the ledger to start polling from.
   * @param limit - Maximum number of events to fetch in this request (default: 50).
   * @returns A promise resolving to an array of raw event objects from the RPC.
   * @throws Error if the RPC request fails or the server is unreachable.
   */
  public async fetchEvents(contractIds: string[], startLedger: number, limit: number = 50) {
    logger.debug({ contractIds, startLedger, limit }, 'Fetching events from RPC');
    
    try {
      // Query the RPC server for contract-specific events
      const response = await this.server.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds,
          },
        ],
        limit,
      });

      return response.events;
    } catch (err) {
      logger.error({ err }, 'Failed to fetch events from Soroban RPC');
      throw err;
    }
  }
}
