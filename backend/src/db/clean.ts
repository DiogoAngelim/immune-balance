import { db } from './index';
import { medicalReports } from './schema';

async function cleanDatabase() {
  // Delete all rows from medical_reports
  await db.delete(medicalReports);
  // Add more tables here if needed
  console.log('Database cleaned.');
}

if (require.main === module) {
  cleanDatabase().then(() => process.exit(0));
}
export { cleanDatabase };
