import { EventFetcher } from './EventFetcher';
import { EventProcessor } from './EventProcessor';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

/**
 * Core service responsible for managing the Spectra contract indexing lifecycle.
 * It coordinates event fetching, processing, and sync state management.
 */
export class IndexerService {
  private fetcher: EventFetcher;
  private processor: EventProcessor;
  private isRunning: boolean = false;

  /**
   * Initializes the indexer service with a connection to a Soroban RPC node.
   * @param rpcUrl - The URL of the Soroban RPC endpoint.
   */
  constructor(rpcUrl: string) {
    this.fetcher = new EventFetcher(rpcUrl);
    this.processor = new EventProcessor();
  }

  /**
   * Starts the background indexing loop for one or more Spectra contracts.
   * 
   * @param network - The network identifier (e.g., 'testnet', 'mainnet').
   * @param contractIds - Array of contract IDs to index events from.
   * @param startLedger - The ledger sequence to start indexing from if no sync state exists.
   */
  public async start(network: string, contractIds: string[], startLedger: number) {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info({ network, contractIds }, 'Starting indexer service');

    while (this.isRunning) {
      try {
        for (const contractId of contractIds) {
          // Check for existing sync state to determine where to resume
          const syncState = await prisma.syncState.findUnique({
            where: { network_contractId: { network, contractId } },
          });

          const currentLedger = syncState?.lastLedger || startLedger;
          
          // Fetch events starting from the next ledger
          const events = await this.fetcher.fetchEvents([contractId], currentLedger + 1);

          if (events.length > 0) {
            // Process the batch of events in a single transaction context
            await this.processor.processEvents(events, network);
            
            // Advance the cursor to the last processed ledger
            const lastLedger = events[events.length - 1].ledger;
            await prisma.syncState.upsert({
              where: { network_contractId: { network, contractId } },
              update: { lastLedger },
              create: { network, contractId, lastLedger },
            });
          }
        }

        // Wait before the next polling cycle
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (err) {
        logger.error({ err }, 'Indexer loop error');
        // Exponential backoff or constant retry delay on failure
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  /**
   * Gracefully stops the indexing loop.
   */
  public stop() {
    this.isRunning = false;
  }
}
