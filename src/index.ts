import 'dotenv/config';
import { createServer } from './server';
import { IndexerService } from './indexer/IndexerService';
import { logger } from './utils/logger';

async function main() {
  const port = Number(process.env.PORT) || 3000;
  const server = await createServer();

  try {
    await server.listen({ port, host: '0.0.0.0' });
    logger.info(`Server listening on port ${port}`);

    const indexer = new IndexerService(process.env.SOROBAN_RPC_URL!);
    const contractIds = process.env.SPECTRAL_CONTRACT_IDS?.split(',') || [];
    const network = process.env.NETWORK_NAME || 'testnet';
    const startLedger = Number(process.env.START_LEDGER) || 0;

    // Start indexer in background
    indexer.start(network, contractIds, startLedger);

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down...');
      indexer.stop();
      await server.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
