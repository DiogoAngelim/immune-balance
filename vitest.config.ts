import { defineConfig } from 'vitest/config';

export default defineConfig({
  coverage: {
    provider: 'v8',
    reporter: ['lcov', 'text'],
    reportsDirectory: './coverage',
  },
});
