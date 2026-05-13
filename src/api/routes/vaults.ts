import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/prisma';

export async function vaultRoutes(fastify: FastifyInstance) {
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

      const where: any = {};
      if (network) where.network = network;
      if (manager) where.manager = manager;

      const [vaults, total] = await Promise.all([
        prisma.vault.findMany({
          where,
          include: { allocations: true, balances: true },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
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

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
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
