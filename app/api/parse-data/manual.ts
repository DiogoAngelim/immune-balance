import { NextRequest, NextResponse } from "next/server";
import { saveMedicalReport } from "./saveMedicalReport";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Save as a new medical report with parsed = data
    const report = await saveMedicalReport({ content: JSON.stringify(data), parsed: data });
    return NextResponse.json({ id: report.id, parsed: data });
  } catch (e: unknown) {
    let message = "Failed to save manual entry";
    if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
      message = (e as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}