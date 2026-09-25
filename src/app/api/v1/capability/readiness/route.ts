import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const profiles = await db.trainingCentreCapabilityProfile.findMany({ include: { trainingCentre: { include: { district: true, institution: true, _count: { select: { trainers: true, equipment: true, courseOfferings: true } } } } }, orderBy: { centreReadinessSignal: "asc" } });
  return ok({ readiness: profiles });
}
