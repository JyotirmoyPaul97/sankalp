import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const gaps = await db.deliveryCapabilityGap.findMany({ include: { course: { select: { name: true } }, trainingCentre: { include: { district: true } } }, orderBy: { overallCapabilityStatus: "asc" } });
  return ok({ gaps });
}
