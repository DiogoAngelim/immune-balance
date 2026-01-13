import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { medicalReports } from "@/app/db/schema";

// GET /api/reports/[id] - returns a report by id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const report = await db.query.medicalReports.findFirst({
    where: (r, { eq }) => eq(r.id, id),
  });
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(report);
}
