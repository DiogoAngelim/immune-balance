import { pgTable, text, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';

export const medicalReports = pgTable('medical_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  parsed: jsonb('parsed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reportName: text('report_name'),
});
