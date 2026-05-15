import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/prisma';

/**
 * Defines API routes for querying indexed vault data.
 * @param fastify - The Fastify instance to register routes on.
 */
export async function vaultRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/vaults
   * Returns a paginated list of all indexed vaults, optionally filtered by network or manager.
   */
  fastify.get('/', {
    schema: {
      querystring: z.object({
        network: z.string().optional(),
        manager: z.string().optional(),
        limit: z.coerce.number().default(20),
        offset: z.coerce.number().default(0),
      }),
    },
    handler: async (request, reply) => {
      const { network, manager, limit, offset } = request.query as any;

      // Build the query filters
      const where: any = {};
      if (network) where.network = network;
      if (manager) where.manager = manager;

      // Fetch vaults and total count in parallel
      const [vaults, total] = await Promise.all([
        prisma.vault.findMany({
          where,
          include: { allocations: true, balances: true },
          take: limit,
          skip: offset,
          orderBy: { createdLedger: 'desc' }, // Order by newest first
        }),
        prisma.vault.count({ where }),
      ]);

      return {
        vaults,
        pagination: {
          total,
          limit,
          offset,
        },
      };
    },
  });

  /**
   * GET /v1/vaults/:id
   * Returns detailed information for a specific vault by its unique ID.
   */
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    // Fetch the vault with all related strategy data
    const vault = await prisma.vault.findUnique({
      where: { id },
      include: { allocations: true, balances: true, rebalances: true },
    });

    if (!vault) {
      return reply.status(404).send({ error: 'Vault not found' });
    }

    return vault;
  });
}
