import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const equipment = await db.trainingEquipment.findMany({ include: { trainingCentre: { include: { district: true } }, _count: { select: { skillMappings: true, courseMappings: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return ok({ equipment });
}
