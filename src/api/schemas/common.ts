import { z } from 'zod';

export const paginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export const errorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});
