import { db } from "../../../backend/src/db/index";
import { medicalReports } from "../../../backend/src/db/schema";


export async function saveMedicalReport({ content, parsed, reportName }: { content: string; parsed: unknown; reportName?: string }) {
  if (typeof content !== "string" || !content.trim()) {
    console.warn("saveMedicalReport: Invalid or empty content, skipping insert.");
    return null;
  }
  if (typeof parsed !== "object" || parsed == null) {
    console.warn("saveMedicalReport: Invalid or empty parsed object, skipping insert.");
    return null;
  }
  try {
    return await db.insert(medicalReports).values({
      content,
      parsed,
      reportName,
    });
  } catch (err) {
    console.error("saveMedicalReport: DB insert failed:", err);
    return null;
  }
}
