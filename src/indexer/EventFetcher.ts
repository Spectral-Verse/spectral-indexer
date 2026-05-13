import { SorobanRpc, xdr, scValToNative } from '@stellar/stellar-sdk';
import { logger } from '../utils/logger';

export class EventFetcher {
  private server: SorobanRpc.Server;

  constructor(rpcUrl: string) {
    this.server = new SorobanRpc.Server(rpcUrl);
  }

  public async fetchEvents(contractIds: string[], startLedger: number, limit: number = 50) {
    logger.debug({ contractIds, startLedger, limit }, 'Fetching events from RPC');
    
    try {
      const response = await this.server.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds,
          },
        ],
        pagination: {
          limit,
        },
      });

      return response.events;
    } catch (err) {
      logger.error({ err }, 'Failed to fetch events from Soroban RPC');
      throw err;
    }
  }
}
