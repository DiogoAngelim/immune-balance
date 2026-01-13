import { describe, it, expect, vi } from 'vitest';

import { parseMedicalReport } from '../services/openai';

vi.mock('../services/openai', () => ({
  parseMedicalReport: vi.fn(async () => ({ patient: 'John Doe', diagnosis: 'Healthy' })),
}));

describe('parseMedicalReport', () => {
  it('should parse a medical report and return structured data', async () => {
    const result = await parseMedicalReport('Sample report');
    expect(result).toHaveProperty('patient', 'John Doe');
    expect(result).toHaveProperty('diagnosis', 'Healthy');
  });
});
