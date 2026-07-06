import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { logger } from './utils/logger';
import { vaultRoutes } from './api/routes/vaults';
import { positionRoutes } from './api/routes/positions';

export async function createServer() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors);
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Spectral Indexer API',
        description: 'API for querying indexed Spectral Verse vault data',
        version: '0.1.0',
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Register routes
  await fastify.register(vaultRoutes, { prefix: '/v1/vaults' });
  await fastify.register(positionRoutes, { prefix: '/v1/positions' });

  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  return fastify;
}
