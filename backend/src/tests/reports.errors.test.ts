import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify from 'fastify';

import { registerRoutes } from '../routes';

vi.mock('../db', () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: async () => [{ id: 'mock-id', content: '', parsed: { error: 'Failed' } }],
      }),
    }),
    query: {
      medicalReports: {
        findFirst: async ({ where }: any) => null,
      },
    },
    delete: async () => {},
  },
}));
vi.mock('../db/schema', () => ({ medicalReports: {} }));

vi.mock('../services/openai', () => ({
  parseMedicalReport: vi.fn(async () => ({
    error: 'Failed to parse OpenAI response as JSON',
    raw: '',
  })),
}));

let app: ReturnType<typeof Fastify>;
beforeAll(async () => {
  app = Fastify();
  registerRoutes(app);
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe('POST /reports error handling', () => {
  it('should return 400 if content is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reports',
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('error', 'Missing report content');
  });

  it('should handle OpenAI parse error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reports',
      payload: { content: 'bad input' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().parsed).toHaveProperty('error');
  });
});
