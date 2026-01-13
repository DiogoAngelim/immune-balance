import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { reportsRoutes } from '../routes/reports';
import { parseMedicalReport } from '../services/openai';
import { db } from '../db';
import { medicalReports } from '../db/schema';

// Mock dependencies
vi.mock('../services/openai', () => ({
  parseMedicalReport: vi.fn(async (content: string) => ({ parsed: true, content }))
}));
vi.mock('../db', () => ({
  db: {
    insert: vi.fn(() => ({ values: () => ({ returning: async () => [{ id: 'mock-id', parsed: { parsed: true } }] }) })),
    query: {
      medicalReports: {
        findFirst: vi.fn(async ({ where }: any) => {
          // Simulate Fastify's where function for id
          if (where) {
            // where is a function: (r, { eq }) => eq(r.id, id)
            // We'll simulate calling it with a mock row and eq
            const eq = (a: any, b: any) => a === b;
            const mockRow = { id: 'mock-id' };
            // If where returns true for mock-id, return the report
            if (where(mockRow, { eq })) {
              return { id: 'mock-id', content: 'test', parsed: { parsed: true } };
            }
          }
          return null;
        })
      }
    }
  }
}));
vi.mock('pdf-parse', () => ({
  PDFParse: class {
    constructor() { }
    async getText() { return { text: 'mock pdf text' }; }
  }
}));

function createMockApp() {
  const routes: any = {};
  return {
    post: (path: string, handler: any) => { routes[path] = handler; },
    get: (path: string, handler: any) => { routes[path] = handler; },
    inject: async ({ method = 'POST', url, payload, params, file }: any) => {
      const reply = { status: (code: number) => ({ send: (body: any) => ({ code, body }) }), send: (body: any) => body };
      const request: any = { body: payload, params, file: async () => file };
      const result = await routes[url](request, reply);
      // If result is an object with code, return as is
      if (result && typeof result === 'object' && 'code' in result) return result;
      // If result is a reply.send, wrap with code 200
      if (result && typeof result === 'object' && !('code' in result)) {
        // If found report (has id), wrap with code 200 and ensure all fields
        if ('id' in result && 'content' in result && 'parsed' in result) {
          return { code: 200, id: result.id, content: result.content, parsed: result.parsed };
        }
        return { code: 200, ...result };
      }
      return result;
    },
    ready: async () => { },
    close: async () => { }
  };
}

describe('reportsRoutes', () => {
  let app: any;
  beforeAll(() => { app = createMockApp(); reportsRoutes(app); });

  it('should handle missing file upload', async () => {
    const res = await app.inject({ url: '/upload-report', file: null });
    expect(res.code).toBe(400);
    expect(res.body.error).toBe('No file uploaded');
  });

  it('should handle unsupported file type', async () => {
    const res = await app.inject({ url: '/upload-report', file: { mimetype: 'image/png', toBuffer: async () => Buffer.from('') } });
    expect(res.code).toBe(400);
    expect(res.body.error).toBe('Unsupported file type');
  });

  it('should handle valid PDF upload', async () => {
    const res = await app.inject({ url: '/upload-report', file: { mimetype: 'application/pdf', toBuffer: async () => Buffer.from('PDF') } });
    expect(res.code).toBe(200);
    expect(res.id).toBe('mock-id');
    expect(res.parsed).toBeDefined();
  });

  it('should handle valid text upload', async () => {
    const res = await app.inject({ url: '/upload-report', file: { mimetype: 'text/plain', toBuffer: async () => Buffer.from('text') } });
    expect(res.id).toBe('mock-id');
    expect(res.parsed).toBeDefined();
  });

  it('should handle missing report content in /reports', async () => {
    const res = await app.inject({ url: '/reports', payload: {} });
    expect(res.code).toBe(400);
    expect(res.body.error).toBe('Missing report content');
  });

  it('should handle valid report content in /reports', async () => {
    const res = await app.inject({ url: '/reports', payload: { content: 'test' } });
    expect(res.id).toBe('mock-id');
    expect(res.parsed).toBeDefined();
  });

  it('should handle not found in /reports/:id', async () => {
    const res = await app.inject({ method: 'GET', url: '/reports/:id', params: { id: 'not-found' } });
    expect(res.code).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('should handle found report in /reports/:id', async () => {
    const res = await app.inject({ method: 'GET', url: '/reports/:id', params: { id: 'mock-id' } });
    // Log the response for debugging
    // console.log('Found report response:', res);
    expect(res).toMatchObject({ code: 200, id: 'mock-id', content: 'test', parsed: { parsed: true } });
  });
});
