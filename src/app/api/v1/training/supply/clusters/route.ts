import { ok } from "@/lib/api";
import { db } from "@/lib/db";
import { getTrainingSupply } from "@/lib/intelligence/training";

/** GET /api/v1/training/supply/clusters */
export async function GET() {
  const clusters = await db.economicCluster.findMany({
    include: {
      district: true,
      sector: true,
      _count: { select: { employers: true } },
    },
  });
  const out = [];
  for (const c of clusters) {
    const supply = await getTrainingSupply({ districtId: c.districtId ?? undefined, sectorId: c.sectorId ?? undefined });
    // Relevant courses in this cluster's district+sector
    const courses = await db.course.findMany({
      where: { sectorId: c.sectorId ?? undefined },
      take: 5,
      select: { id: true, name: true },
    });
    out.push({
      cluster: { id: c.id, name: c.name, district: c.district?.name ?? null, sector: c.sector?.name ?? null, employerCount: c._count.employers },
      activeCourses: supply?.activeDelivery ?? 0,
      plannedCapacity: supply?.plannedCapacity ?? 0,
      enrolledCount: supply?.enrolledCount ?? null,
      institutions: supply?.institutionCount ?? 0,
      centres: supply?.centreCount ?? 0,
      confidence: supply?.confidenceLevel ?? "INSUFFICIENT",
      relevantCourses: courses,
    });
  }
  out.sort((a, b) => b.plannedCapacity - a.plannedCapacity);
  return ok({ clusters: out });
}
