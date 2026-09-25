import { ok } from "@/lib/api";
import { db } from "@/lib/db";
import { getTrainingSupply } from "@/lib/intelligence/training";

/** GET /api/v1/training/supply/sectors */
export async function GET() {
  const sectors = await db.sector.findMany({
    include: { _count: { select: { courses: true } } },
  });
  const out = [];
  for (const s of sectors) {
    const supply = await getTrainingSupply({ sectorId: s.id });
    out.push({
      sector: { id: s.id, name: s.name, courseCount: s._count.courses },
      activeCourses: supply?.activeDelivery ?? 0,
      plannedCapacity: supply?.plannedCapacity ?? 0,
      enrolledCount: supply?.enrolledCount ?? null,
      completedCount: supply?.completedCount ?? null,
      institutions: supply?.institutionCount ?? 0,
      centres: supply?.centreCount ?? 0,
      confidence: supply?.confidenceLevel ?? "INSUFFICIENT",
    });
  }
  out.sort((a, b) => b.plannedCapacity - a.plannedCapacity);
  return ok({ sectors: out });
}
