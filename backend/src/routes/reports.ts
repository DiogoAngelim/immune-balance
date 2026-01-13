import { PDFParse } from 'pdf-parse';
import { FastifyInstance } from 'fastify';

import { db } from '../db';
import { medicalReports } from '../db/schema';
import { parseMedicalReport } from '../services/openai';

export async function reportsRoutes(app: FastifyInstance) {
  // Upload endpoint for PDF or text lab reports
  app.post('/upload-report', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    let content = '';
    if (data.mimetype === 'application/pdf') {
      const buffer = await data.toBuffer();
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      content = pdfData.text;
    } else if (data.mimetype.startsWith('text/')) {
      content = (await data.toBuffer()).toString('utf-8');
    } else {
      return reply.status(400).send({ error: 'Unsupported file type' });
    }

    // Send extracted content to OpenAI for parsing and standardization
    const parsed = await parseMedicalReport(content);
    // Store in DB
    const [report] = await db.insert(medicalReports).values({ content, parsed }).returning();
    return { id: report.id, parsed };
  });
  app.post('/reports', async (request, reply) => {
    const { content } = request.body as { content: string };
    if (!content) return reply.status(400).send({ error: 'Missing report content' });

    // Parse with OpenAI
    const parsed = await parseMedicalReport(content);
    // Store in DB
    const [report] = await db.insert(medicalReports).values({ content, parsed }).returning();
    return { id: report.id, parsed };
  });

  app.get('/reports/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await db.query.medicalReports.findFirst({ where: (r, { eq }) => eq(r.id, id) });
    if (!report) return reply.status(404).send({ error: 'Not found' });
    return report;
  });
}
