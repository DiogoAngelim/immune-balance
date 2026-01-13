// Custom error for API responses
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Types for signals and events
interface SignalResult {
  id: number | string;
  name: string;
  technicalName: string;
  explanation: string;
  interpretation: string;
  rawValue: unknown;
  measurementMethod: string;
  status: "usual" | "elevated" | "returning";
}

interface LabEvent {
  id: string;
  title: string;
  type: string;
  description: string;
  date: string | null;
  details: Record<string, unknown>;
}

interface ParsedLabReport {
  signals: SignalResult[];
  events: LabEvent[];
  reportName: string;
  [key: string]: unknown;
}
import { OpenAI } from "openai";
import { saveMedicalReport } from "./saveMedicalReport";
import { extractPdfText } from "./pdfUtil";

export async function parseDataHandler({ file, openai }: { file: File, openai?: unknown }) {
  let arrayBuffer: ArrayBuffer, text = "", fileType = "";
  let reportName = "Lab Report";
  try {
    // Support both browser File and Node.js Buffer
    if (typeof file.arrayBuffer === "function") {
      arrayBuffer = await file.arrayBuffer();
    } else if (file instanceof Buffer) {
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    } else {
      throw new ApiError("Unsupported file type", 400);
    }
    const name = typeof file.name === "string" ? file.name : "";
    fileType = name.split(".").pop()?.toLowerCase() || "";
    if (name) {
      // Remove extension for display
      reportName = name.replace(/\.[^/.]+$/, "");
    }
    if (fileType === "pdf") {
      text = await extractPdfText(arrayBuffer);
    } else {
      text = new TextDecoder().decode(arrayBuffer);
    }
    if (!text || text.trim() === "") {
      throw new ApiError("File is empty or could not be parsed", 400);
    }
  } catch (err) {
    console.error("Error reading file or extracting text:", err);
    if (err instanceof ApiError) throw err;
    const message = typeof err === "object" && err !== null && "message" in err ? (err as any).message : String(err);
    throw new ApiError("File read or PDF extraction failed: " + message, 400);
  }
  // ...existing code...
  // Always set parsed.signals to an array

  let openaiClient: OpenAI, completion: any, parsed: ParsedLabReport = { signals: [], events: [], reportName };
  try {
    openaiClient = openai instanceof OpenAI ? openai : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // Try to extract just the results table from CSV or text
    let resultsSection = text;
    // If CSV, try to extract only the lines after the header row (skip patient/lab info)
    if (fileType === "csv") {
      const lines = text.split(/\r?\n/);
      // Heuristic: find the first line with 'Test' or 'Name' and treat as header
      const headerIdx = lines.findIndex(line => /test|name/i.test(line));
      if (headerIdx !== -1) {
        resultsSection = lines.slice(headerIdx).join("\n");
      }
    }
    const prompt = `Parse and standardize the following lab results table. Always return a JSON object with two top-level arrays: 'signals' (for all test results) and 'events' (for any clinical or notable events, medication changes, or findings you can infer from the results or context, or an empty array if none).\n\nFor each event in the 'events' array, include:\n- 'title': a short, human-readable summary of the event (e.g., 'Positive ANA', 'Possible Infection', 'Medication Change').\n- 'type': a machine-friendly event type (e.g., 'infection', 'medication', 'finding', etc.).\n- 'description': a longer explanation or context for the event.\n- 'date', 'details', and any other relevant fields if available.\n\nIf you can infer any possible events (e.g., abnormal results, medication changes, or clinical notes), include them in the events array.\n\nLab Results Table:\n${resultsSection}`;
    completion = await openaiClient.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a medical data parser. Output valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 3072, // increased if supported
    });
    console.log("OpenAI full completion object:", completion);
    console.log("OpenAI raw response:", completion.choices[0]?.message?.content);
    try {
      parsed = { ...parsed, ...JSON.parse(completion.choices[0].message.content || '{}') };
    } catch (jsonErr) {
      console.error("Invalid JSON from OpenAI:", jsonErr, completion.choices[0]?.message?.content);
      // Fallback: try to extract the tests array from the raw response
      const match = completion.choices[0].message.content?.match(/"tests"\s*:\s*(\[[\s\S]*?\])/i);
      if (match) {
        try {
          parsed = { ...parsed, tests: JSON.parse(match[1]) };
        } catch (arrErr) {
          console.error("Fallback array parse failed:", arrErr);
        }
      }
    }
    console.log("OpenAI parsed response:", parsed);
    // --- Signal extraction and fallback logic START ---
    let signals: SignalResult[] = [];
    // Defensive: always check for object and array
    if (parsed && typeof parsed === 'object') {
      // 1. lab_report.tests (Life Extension CSV)
      if (parsed.lab_report && Array.isArray((parsed.lab_report as any).tests)) {
        signals = (parsed.lab_report as any).tests.map((result: Record<string, unknown>, idx: number) => ({
          id: idx + 1,
          name: String(result.test_name || result.name || "Unknown"),
          technicalName: String(result.test_name || result.name || "Unknown"),
          explanation: "",
          interpretation: "",
          rawValue: result.result,
          measurementMethod: String(result.units || ""),
          status:
            result.flag === "High" || result.flag === "Higher than normal" || result.flag === "Abnormal"
              ? "elevated"
              : result.flag === "Low"
                ? "returning"
                : "usual",
        }));
      } else if (Array.isArray((parsed as any).tests)) {
        signals = (parsed as any).tests.map((result: Record<string, unknown>, idx: number) => ({
          id: idx + 1,
          name: String(result.test_name || result.name || "Unknown"),
          technicalName: String(result.test_name || result.name || "Unknown"),
          explanation: "",
          interpretation: "",
          rawValue: result.result,
          measurementMethod: String(result.units || ""),
          status:
            result.flag === "High" || result.flag === "Higher than normal" || result.flag === "Abnormal"
              ? "elevated"
              : result.flag === "Low"
                ? "returning"
                : "usual",
        }));
      } else if (parsed.report && Array.isArray((parsed.report as any).results)) {
        signals = (parsed.report as any).results.map((result: Record<string, unknown>, idx: number) => ({
          id: idx + 1,
          name: String(result.test_name || "Unknown"),
          technicalName: String(result.test_name || "Unknown"),
          explanation: "",
          interpretation: "",
          rawValue: result.result,
          measurementMethod: "",
          status:
            result.flag === "High" || result.flag === "Higher than normal"
              ? "elevated"
              : result.flag === "Low"
                ? "returning"
                : "usual",
        }));
      } else if (Array.isArray((parsed as any).results)) {
        signals = (parsed as any).results.map((result: Record<string, unknown>, idx: number) => ({
          id: idx + 1,
          name: String(result.test || "Unknown"),
          technicalName: String(result.test || "Unknown"),
          explanation: "",
          interpretation: "",
          rawValue: result.result,
          measurementMethod: String(result.units || ""),
          status: "usual",
        }));
      } else if (parsed.LabReport && Array.isArray((parsed.LabReport as any).Results)) {
        signals = (parsed.LabReport as any).Results.map((result: Record<string, unknown>, idx: number) => ({
          id: idx + 1,
          name: String(result.TestName || "Unknown"),
          technicalName: String(result.TestName || "Unknown"),
          explanation: "",
          interpretation: "",
          rawValue: result.Result,
          measurementMethod: String(result.Units || ""),
          status: "usual",
        }));
      }
      // Fallback: try to extract signals from any array of objects with test-like fields
      if ((!Array.isArray(signals) || signals.length === 0)) {
        for (const key in parsed) {
          const arr = (parsed as any)[key];
          if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object") {
            if (
              arr.some((item: Record<string, unknown>) =>
                ("test" in item || "test_name" in item || "TestName" in item) &&
                ("result" in item || "Result" in item)
              )
            ) {
              signals = arr.map((item: Record<string, unknown>, idx: number) => ({
                id: idx + 1,
                name: String(item.test || item.test_name || item.TestName || "Unknown"),
                technicalName: String(item.test || item.test_name || item.TestName || "Unknown"),
                explanation: "",
                interpretation: "",
                rawValue: item.result || item.Result,
                measurementMethod: String(item.units || item.Units || ""),
                status: "usual",
              }));
              break;
            }
          }
        }
      }
    }
    parsed.signals = signals;
    // Always set a reportName for the parsed object
    parsed.reportName = reportName;
    // --- Signal extraction and fallback logic END ---
  } catch (err) {
    console.error("Error with OpenAI or parsing response:", err);
    const message = typeof err === "object" && err !== null && "message" in err ? (err as any).message : String(err);
    throw new Error("OpenAI or parsing failed: " + message);
  }

  // (No-op: signal extraction is now handled above, after OpenAI response parsing)
  // Fallback: handle Lab.Results (e.g., OpenAI returns { Lab: { Results: [...] } })
  if ((!Array.isArray(parsed.signals) || parsed.signals.length === 0) && parsed.Lab && Array.isArray((parsed.Lab as any).Results)) {
    parsed.signals = (parsed.Lab as any).Results.map((result: any, idx: number) => ({
      id: idx + 1,
      name: String(result.Test || result.TestName || "Unknown"),
      technicalName: String(result.Test || result.TestName || "Unknown"),
      explanation: "",
      interpretation: "",
      rawValue: result.Result || result.result,
      measurementMethod: String(result.Units || result.units || ""),
      status: "usual",
    }));
  }

  // Transform events for frontend compatibility
  let events: LabEvent[] = [];
  // 1. events (top-level)
  if (Array.isArray((parsed as any).events)) {
    events = ((parsed as any).events).map((event: Record<string, unknown>, idx: number) => ({
      id: String(event.id || `event-${idx}`),
      title: String(event.title || ""),
      type: String(event.type || "event"),
      description: String(event.description || ""),
      date: typeof event.date === "string" ? event.date : new Date().toISOString(),
      details: typeof event.details === "object" && event.details !== null ? event.details as Record<string, unknown> : {},
    }));
  } else if (parsed.report && Array.isArray((parsed.report as any).events)) {
    events = ((parsed.report as any).events).map((event: Record<string, unknown>, idx: number) => ({
      id: String(event.id || `event-${idx}`),
      title: String(event.title || ""),
      type: String(event.type || "event"),
      description: String(event.description || ""),
      date: typeof event.date === "string" ? event.date : new Date().toISOString(),
      details: typeof event.details === "object" && event.details !== null ? event.details as Record<string, unknown> : {},
    }));
  } else if (parsed.lab_report && Array.isArray((parsed.lab_report as any).events)) {
    events = ((parsed.lab_report as any).events).map((event: Record<string, unknown>, idx: number) => ({
      id: String(event.id || `event-${idx}`),
      title: String(event.title || ""),
      type: String(event.type || "event"),
      description: String(event.description || ""),
      date: typeof event.date === "string" ? event.date : new Date().toISOString(),
      details: typeof event.details === "object" && event.details !== null ? event.details as Record<string, unknown> : {},
    }));
  }
  // 4. Fallback: any array of objects with type/description/date fields
  if (events.length === 0 && parsed && typeof parsed === "object") {
    for (const key in parsed) {
      const arr = (parsed as any)[key];
      if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object") {
        if (
          arr.some((item: Record<string, unknown>) => "type" in item && "description" in item)
        ) {
          events = arr.map((item: Record<string, unknown>, idx: number) => ({
            id: String(item.id || `event-${idx}`),
            title: String(item.title || ""),
            type: String(item.type || "event"),
            description: String(item.description || ""),
            date: typeof item.date === "string" ? item.date : null,
            details: typeof item.details === "object" && item.details !== null ? item.details as Record<string, unknown> : {},
          }));
          break;
        }
      }
    }
  }
  parsed.events = events;
  try {
    console.log("Parsed object before save:", parsed);
    const saveResult = await saveMedicalReport({ content: text, parsed, reportName });
    console.log("Database save result:", saveResult);
  } catch (err) {
    console.error("Error saving to database:", err);
    const message = typeof err === "object" && err !== null && "message" in err ? (err as any).message : String(err);
    throw new Error("Database save failed: " + message);
  }

  return {
    recordCount: Array.isArray(parsed?.signals) ? parsed.signals.length : 0,
    ...parsed,
  };
}
