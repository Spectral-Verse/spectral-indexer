import { EventFetcher } from './EventFetcher';
import { EventProcessor } from './EventProcessor';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export class IndexerService {
  private fetcher: EventFetcher;
  private processor: EventProcessor;
  private isRunning: boolean = false;

  constructor(rpcUrl: string) {
    this.fetcher = new EventFetcher(rpcUrl);
    this.processor = new EventProcessor();
  }

  public async start(network: string, contractIds: string[], startLedger: number) {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info({ network, contractIds }, 'Starting indexer service');

    while (this.isRunning) {
      try {
        for (const contractId of contractIds) {
          const syncState = await prisma.syncState.findUnique({
            where: { network_contractId: { network, contractId } },
          });

          const currentLedger = syncState?.lastLedger || startLedger;
          const events = await this.fetcher.fetchEvents([contractId], currentLedger + 1);

          if (events.length > 0) {
            await this.processor.processEvents(events, network);
            
            const lastLedger = events[events.length - 1].ledger;
            await prisma.syncState.upsert({
              where: { network_contractId: { network, contractId } },
              update: { lastLedger },
              create: { network, contractId, lastLedger },
            });
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (err) {
        logger.error({ err }, 'Indexer loop error');
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  public stop() {
    this.isRunning = false;
  }
}
