import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { medicalReports } from "@/app/db/schema";

export async function GET() {
  // Fetch all medical reports from the database
  const reports = await db.select().from(medicalReports);

  // Combine all data (add more tables here if needed)
  const data = {
    medicalReports: reports,
  };

  // Return as JSON file download
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=\"export-all-data.json\"",
    },
  });
}
