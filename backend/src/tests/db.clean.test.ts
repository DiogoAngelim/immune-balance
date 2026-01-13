import { describe, it, expect, vi } from 'vitest';

vi.mock('../db/index', () => ({ db: { delete: vi.fn() } }));
vi.mock('../db/schema', () => ({ medicalReports: {} }));

import { cleanDatabase } from '../db/clean';

describe('db/clean.ts', () => {
  it('should call db.delete and log', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const { db } = await import('../db/index');
    const { medicalReports } = await import('../db/schema');
    await cleanDatabase();
    expect(db.delete).toHaveBeenCalledWith(medicalReports);
    expect(logSpy).toHaveBeenCalledWith('Database cleaned.');
    logSpy.mockRestore();
  });
});
