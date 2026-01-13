export async function GET() {
  return NextResponse.json({
    message: "This endpoint accepts POST requests with a file upload. Use POST to parse data."
  });
}
// Disable canvas and font face in pdfjs-dist for Node.js
// @ts-ignore
process.env["PDFJS_DISABLE_FONT_FACE"] = "true";
// @ts-ignore
process.env["PDFJS_DISABLE_CANVAS"] = "true";

import { NextRequest, NextResponse } from "next/server";
import { parseDataHandler, ApiError } from "./parseDataHandler";

import { JSDOM } from "jsdom";


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const result = await parseDataHandler({ file });
    return NextResponse.json(result);
  } catch (e: unknown) {
    // Log error details for debugging
    console.error("API /api/parse-data error:", e);
    let message = "Failed to process file";
    let stack: string | null = null;
    if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
      message = (e as { message: string }).message;
    }
    if (e && typeof e === "object" && "stack" in e && typeof (e as { stack?: unknown }).stack === "string") {
      stack = (e as { stack: string }).stack;
    }
    const errorResponse = {
      error: message,
      stack,
      details: e,
    };
    if (e instanceof ApiError) {
      return NextResponse.json(errorResponse, { status: e.status });
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
