import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

(() => {
  // Always log the DB connection string, even if imported as a module
  // and only when the environment variable is available
  // This will help debug which DB is being used in all contexts
  // eslint-disable-next-line no-console
  console.log('DB connection string:', process.env.DATABASE_URL);
})();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
