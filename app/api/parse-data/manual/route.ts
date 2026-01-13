

import { NextRequest, NextResponse } from "next/server";
import { saveMedicalReport } from "../saveMedicalReport";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();

    // Improved prompt for manual entry: explain the task, give an example, and clarify the output format
    const prompt = `You are a medical data parser. Given the following manually entered lab data, extract and standardize all relevant signals and events.\n\nInput (free-form, may be incomplete or unstructured):\n${text}\n\nOutput a JSON object with two arrays: 'signals' and 'events'.\n\nExample output:\n{\n  "signals": [\n    {\n      "name": "CRP",\n      "technicalName": "C-reactive protein",\n      "explanation": "CRP is a marker of inflammation.",\n      "interpretation": "Within usual range",\n      "rawValue": "2 mg/L",\n      "measurementMethod": "Blood test",\n      "status": "usual"\n    }\n  ],\n  "events": [\n    {\n      "type": "infection",\n      "description": "Mild cold symptoms",\n      "date": "2026-01-10",\n      "details": {}\n    }\n  ]\n}\n\nIf no signals or events are found, return empty arrays. Output valid JSON only.`;

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

    const report = await saveMedicalReport({ content: text, parsed });
    return NextResponse.json({ id: report.id, parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save manual entry" }, { status: 400 });
  }
}
