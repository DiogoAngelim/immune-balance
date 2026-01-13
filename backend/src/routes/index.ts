import { FastifyInstance } from 'fastify';

import { reportsRoutes } from './reports';

export function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));
  reportsRoutes(app);
}
