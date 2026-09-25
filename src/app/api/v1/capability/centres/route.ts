import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const profiles = await db.trainingCentreCapabilityProfile.findMany({ include: { trainingCentre: { include: { district: true, institution: true } } }, orderBy: { centreReadinessSignal: "asc" } });
  return ok({ centres: profiles });
}
