

import type { PDFParse as PDFParseType } from "pdf-parse";

export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  // Use dynamic import for compatibility with ESM
  const pdfParseModule = await import("pdf-parse");
  const PDFParse: typeof PDFParseType = pdfParseModule.PDFParse;
  const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });
  const result: { text?: string } = await parser.getText();
  return result.text || "";
}
