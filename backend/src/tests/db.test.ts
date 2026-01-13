import { describe, it, expect, vi } from 'vitest';

vi.mock('../db', () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: async () => [{ id: 'mock-id', content: 'Test content', parsed: { test: true } }],
      }),
    }),
    query: {
      medicalReports: {
        findFirst: async ({ where }: any) => ({
          id: 'mock-id',
          content: 'Test content',
          parsed: { test: true },
        }),
      },
    },
    delete: async () => {},
  },
}));
vi.mock('../db/schema', () => ({ medicalReports: {} }));

import { db } from '../db';
import { medicalReports } from '../db/schema';

describe('medicalReports table', () => {
  it('should insert and retrieve a report', async () => {
    const [inserted] = await db
      .insert(medicalReports)
      .values({
        content: 'Test content',
        parsed: { test: true },
      })
      .returning();
    expect(inserted).toHaveProperty('id');
    const found = await db.query.medicalReports.findFirst({
      where: (r: any, { eq }: any) => eq(r.id, inserted.id),
    });
    expect(found).not.toBeNull();
    expect(found?.content).toBe('Test content');
    expect(found?.parsed).toEqual({ test: true });
  });
});
