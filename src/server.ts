import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { logger } from './utils/logger';

export async function createServer() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors);
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Spectra Indexer API',
        description: 'API for querying indexed Spectra vault data',
        version: '0.1.0',
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Register routes
  // fastify.register(vaultRoutes, { prefix: '/v1/vaults' });
  // fastify.register(positionRoutes, { prefix: '/v1/positions' });

  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  return fastify;
}
