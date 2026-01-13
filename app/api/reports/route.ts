import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { medicalReports } from "@/app/db/schema";

// GET /api/reports - returns all reports
export async function GET() {
  const reports = await db.query.medicalReports.findMany({
    orderBy: (reports, { desc }) => [desc(reports.createdAt)],
  });
  return NextResponse.json(reports);
}
