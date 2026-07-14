import { describe, it, expect, afterAll } from 'vitest';
import { createServer } from '../src/server';
import { FastifyInstance } from 'fastify';

describe('Server Smoke Test', () => {
  let server: FastifyInstance;

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  it('should boot and respond to /health with status: ok', async () => {
    server = await createServer();
    
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
  });
});
