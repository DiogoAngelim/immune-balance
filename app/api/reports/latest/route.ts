import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { medicalReports } from "@/app/db/schema";

// GET /api/reports/latest - returns the latest report (with signals/events)
export async function GET() {
  const report = await db.query.medicalReports.findFirst({
    orderBy: (reports, { desc }) => [desc(reports.createdAt)],
  });
  if (!report) {
    return NextResponse.json({ error: "No reports found" }, { status: 404 });
  }
  return NextResponse.json(report);
}
