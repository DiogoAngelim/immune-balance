import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('pg', () => ({ Pool: class { constructor() { this.connect = vi.fn(); } } }));
vi.mock('drizzle-orm/node-postgres', () => ({ drizzle: vi.fn((pool, opts) => ({ pool, opts })) }));

const OLD_ENV = process.env;

describe('db/index.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV, DATABASE_URL: 'postgres://test' };
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });
  it('should create a Pool and drizzle instance', async () => {
    const { db } = await import('../db/index');
    expect(db).toBeDefined();
    expect(db).toHaveProperty('pool');
    expect(db).toHaveProperty('opts');
  });
  it('should log the DB connection string', async () => {
    const logSpy = vi.spyOn(console, 'log');
    await import('../db/index');
    expect(logSpy).toHaveBeenCalledWith('DB connection string:', 'postgres://test');
    logSpy.mockRestore();
  });
});
