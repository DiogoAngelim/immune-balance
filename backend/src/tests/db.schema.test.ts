import { describe, it, expect } from 'vitest';
import * as schema from '../db/schema';

describe('db/schema.ts', () => {
  it('should export medicalReports table', () => {
    expect(schema.medicalReports).toBeDefined();
    expect(typeof schema.medicalReports).toBe('object');
  });
});
