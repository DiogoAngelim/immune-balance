// DELETE /api/reports/events?id=EVENT_ID - deletes an event from all medical reports
import { eq } from "drizzle-orm";
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }
  // Find all reports containing the event
  const reports = await db.query.medicalReports.findMany();
  let deleted = false;
  interface Event {
    id: string;
    [key: string]: unknown;
  }
  for (const report of reports) {
    if (Array.isArray(report.parsed?.events)) {
      const filteredEvents = (report.parsed.events as Event[]).filter((e: Event) => e.id !== id);
      if (filteredEvents.length !== report.parsed.events.length) {
        // Update report with filtered events
        await db.update(medicalReports)
          .set({ parsed: { ...report.parsed, events: filteredEvents } })
          .where(eq(medicalReports.id, report.id));
        deleted = true;
      }
    }
  }
  if (deleted) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
}
// POST /api/reports/events - saves a custom event to a new medical report
export async function POST(req: Request) {
  const body = await req.json();
  // Validate event shape
  if (!body || !body.type || !body.date) {
    return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
  }
  // Create a new medical report with this event
  const newReport = await db.insert(medicalReports).values({
    content: "custom event",
    parsed: { events: [body] },
  }).returning();
  return NextResponse.json(newReport[0]?.parsed?.events?.[0] || body);
}
import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { medicalReports } from "@/app/db/schema";

// GET /api/reports/events - returns all events from all reports
export async function GET() {
  const reports = await db.query.medicalReports.findMany({
    orderBy: (reports, { desc }) => [desc(reports.createdAt)],
  });
  // Flatten all events from all reports
  const allEvents = reports.flatMap(r => (r.parsed?.events ? r.parsed.events : []));
  return NextResponse.json(allEvents);
}
