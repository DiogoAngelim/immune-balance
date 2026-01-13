import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedMedicalReport {
  [key: string]: unknown;
  error?: string;
  raw?: string;
}

export async function parseMedicalReport(reportText: string): Promise<ParsedMedicalReport> {
  const prompt = `You are a medical data extraction assistant.\n\nExtract and standardize the following clinical lab report.\n\n- The report may be in any language.\n- Auto-detect the language and extract the data.\n- Always output the standardized JSON in English.\n\n1. Detect the report type (CBC, CRP, cytokines, etc).\n2. Output a single measurement event with all detected signals.\n3. Use this strict JSON format:\n{\n  \\"event_type\\": \\"lab_measurement\\",\n  \\"report_type\\": \\"CBC\\" | \\"CRP\\" | \\"Cytokines\\" | \\"Immune Regulation\\" | \\"Functional Outcome\\",\n  \\"signals\\": {\n    \\"neutrophils\\": number,\n    \\"lymphocytes\\": number,\n    \\"nlr\\": number,\n    \\"crp\\": number,\n    \\"il6\\": number,\n    \\"tnfa\\": number,\n    \\"il10\\": number,\n    \\"ifng\\": number,\n    \\"treg_ratio\\": number,\n    \\"cd4_cd8_ratio\\": number,\n    \\"foxp3\\": number,\n    \\"vaccine_titer\\": number,\n    \\"neutralization_assay\\": number\n    // Only include present values\n  }\n}\n\nIf a value is not present, omit it from the signals object.\n\nReport:\n${reportText}`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a medical data extraction assistant.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });
  // Try to parse the model's response as JSON
  const content = response.choices[0].message.content;
  try {
    return JSON.parse(content || '{}');
  } catch {
    return { error: 'Failed to parse OpenAI response as JSON', raw: content ?? '' };
  }
}
