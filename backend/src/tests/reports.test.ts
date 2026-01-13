import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify from 'fastify';

import { registerRoutes } from '../routes';
// Mock db and medicalReports for pure unit tests
vi.mock('../db', () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: async () => [
          {
            id: 'mock-id',
            content: 'Patient: John Doe. Diagnosis: Healthy.',
            parsed: { patient: 'John Doe', diagnosis: 'Healthy' },
          },
        ],
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
  parseMedicalReport: vi.fn(async () => ({ patient: 'John Doe', diagnosis: 'Healthy' })),
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
describe('POST /reports', () => {
  it('should parse and store a report', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reports',
      payload: { content: 'Patient: John Doe. Diagnosis: Healthy.' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('parsed');
  });
});

describe('GET /reports/:id', () => {
  it('should return 404 for missing report', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/nonexistent-id',
    });
    expect(response.statusCode).toBe(404);
  });
});
