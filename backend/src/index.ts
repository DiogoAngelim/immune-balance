import 'dotenv/config';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';

import { registerRoutes } from './routes';

const app = Fastify({ logger: true });
app.register(multipart);
registerRoutes(app);

const start = async () => {
  try {
    await app.listen({ port: 4000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:4000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
