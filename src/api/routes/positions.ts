import { FastifyInstance } from 'fastify';
import { prisma } from '../../db/prisma';

export async function positionRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          account: { type: 'string' },
          vaultId: { type: 'string' },
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 },
        },
      },
    },
    handler: async (request, reply) => {
      const { account, vaultId, limit, offset } = request.query as any;

      const where: any = {};
      if (account) where.account = account;
      if (vaultId) where.vaultId = vaultId;

      const [positions, total] = await Promise.all([
        prisma.position.findMany({
          where,
          include: { vault: true },
          take: limit,
          skip: offset,
          orderBy: { lastActivityAt: 'desc' },
        }),
        prisma.position.count({ where }),
      ]);

      return {
        positions,
        pagination: {
          total,
          limit,
          offset,
        },
      };
    },
  });
}
