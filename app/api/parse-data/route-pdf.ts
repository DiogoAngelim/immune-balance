import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { saveMedicalReport } from "./saveMedicalReport";
import { PDFParse } from "pdf-parse";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let text = "";
  const fileType = file.name.split(".").pop()?.toLowerCase();

  if (fileType === "pdf") {
    // Parse PDF to text
    const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });
    const pdfData = await parser.getText();
    text = pdfData.text;
  } else {
    text = new TextDecoder().decode(arrayBuffer);
  }

  // Compose a prompt for OpenAI to standardize the data
  const prompt = `Parse and standardize the following lab data (from a ${fileType?.toUpperCase()} file) to match the following structure for signals and events.\n\nFile content:\n${text}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: "You are a medical data parser. Output valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0].message.content || "{}");
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse OpenAI response" }, { status: 500 });
  }

  await saveMedicalReport({ content: text, parsed });

  return NextResponse.json({
    recordCount: Array.isArray(parsed.signals) ? parsed.signals.length : 0,
    ...parsed,
  });
}
