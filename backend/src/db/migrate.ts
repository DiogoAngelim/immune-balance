import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { db } from './index';

async function main() {
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migration complete');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
export { main };
