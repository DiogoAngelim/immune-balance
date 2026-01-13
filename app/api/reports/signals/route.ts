

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { medicalReports } from "@/app/db/schema";

interface Signal {
  id: string | number;
  name: string;
  technicalName?: string;
  explanation?: string;
  interpretation?: string;
  rawValue?: unknown;
  measurementMethod?: string;
  status?: string;
  [key: string]: unknown;
}

// GET /api/reports/signals - returns all signals from all reports
export async function GET() {
  const reports = await db.query.medicalReports.findMany({
    orderBy: (reports, { desc }) => [desc(reports.createdAt)],
  });
  // Flatten all signals from all reports, deduplicate by name (latest wins)
  const allSignals = reports.flatMap(r => (typeof r.parsed === 'object' && r.parsed && Array.isArray((r.parsed as any).signals)) ? (r.parsed as any).signals : []);
  const deduped: Record<string, Signal> = {};
  for (const signal of allSignals as Signal[]) {
    deduped[signal.name] = signal;
  }
  return NextResponse.json(Object.values(deduped));
}

// DELETE /api/reports/signals?id=SIGNAL_NAME - deletes a signal from all medical reports
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing signal id" }, { status: 400 });
  }
  // Find all reports containing the signal by id (string)
  const reports = await db.query.medicalReports.findMany();
  let deleted = false;
  for (const report of reports) {
    if (typeof report.parsed === 'object' && report.parsed && Array.isArray((report.parsed as any).signals)) {
      // Log types for debugging
      console.log("Report id type:", typeof report.id, "value:", report.id);
      ((report.parsed as any).signals as Signal[]).forEach((s: Signal) => {
        console.log("Signal id type:", typeof s.id, "value:", s.id);
      });
      // Ensure all ids are strings before saving
      const filteredSignals = ((report.parsed as any).signals as Signal[]).filter((s: Signal) => String(s.id) !== id);
      const signalsWithStringIds = filteredSignals.map((s: Signal) => ({ ...s, id: String(s.id) }));
      if (filteredSignals.length !== ((report.parsed as any).signals as Signal[]).length) {
        // Update report with filtered signals (all ids as strings)
        // Use plain SQL string for update to avoid Drizzle SQL type mismatch
        await db.execute(
          `UPDATE medical_reports SET parsed = '${JSON.stringify({ ...report.parsed, signals: signalsWithStringIds }).replace(/'/g, "''")}' WHERE id = ${report.id}`
        );
        deleted = true;
      }
    }
  }
  if (deleted) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "Signal not found" }, { status: 404 });
  }
}
