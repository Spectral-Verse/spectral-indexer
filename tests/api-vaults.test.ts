import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server';

describe('API Health', () => {
  it('should return 200 on /health', async () => {
    const server = await createServer();
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
