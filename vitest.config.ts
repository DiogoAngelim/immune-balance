import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      '**/*.{test,spec}.{ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/.git/**'
    ],
    environment: 'jsdom',
  },
  coverage: {
    provider: 'v8',
    reporter: ['lcov', 'text'],
    reportsDirectory: './coverage',
  },
});
