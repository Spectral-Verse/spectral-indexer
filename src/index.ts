import { config } from './config/env';
import { createServer } from './server';
import { IndexerService } from './indexer/IndexerService';
import { logger } from './utils/logger';

async function main() {
  const port = config.PORT;
  const server = await createServer();

  try {
    await server.listen({ port, host: '0.0.0.0' });
    logger.info(`Server listening on port ${port}`);

    const indexer = new IndexerService(
      config.SOROBAN_RPC_URL,
      config.POLLING_INTERVAL,
      config.BATCH_SIZE
    );

    // Start indexer in background
    indexer.start(config.NETWORK_NAME, config.SPECTRAL_CONTRACT_IDS, config.START_LEDGER);

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
