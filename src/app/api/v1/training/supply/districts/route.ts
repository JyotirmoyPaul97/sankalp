import { ok } from "@/lib/api";
import { db } from "@/lib/db";
import { getTrainingSupply } from "@/lib/intelligence/training";

/** GET /api/v1/training/supply/districts */
export async function GET() {
  const districts = await db.district.findMany({
    include: {
      _count: { select: { institutions: true, trainingCentres: true } },
    },
  });
  const out = [];
  for (const d of districts) {
    const supply = await getTrainingSupply({ districtId: d.id });
    // Top courses/skills in this district
    const sigs = await db.trainingSupplySignal.findMany({
      where: { districtId: d.id },
      include: { course: true, skill: true },
    });
    const courseMap = new Map<string, number>();
    const skillMap = new Map<string, number>();
    for (const s of sigs) {
      if (s.course) courseMap.set(s.course.name, (courseMap.get(s.course.name) ?? 0) + s.plannedCapacity);
      if (s.skill) skillMap.set(s.skill.name, (skillMap.get(s.skill.name) ?? 0) + s.plannedCapacity);
    }
    const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, cap]) => ({ name, capacity: cap }));
    out.push({
      district: { id: d.id, name: d.name, institutionCount: d._count.institutions, centreCount: d._count.trainingCentres },
      activeCourses: supply?.activeDelivery ?? 0,
      plannedCapacity: supply?.plannedCapacity ?? 0,
      enrolledCount: supply?.enrolledCount ?? null,
      completedCount: supply?.completedCount ?? null,
      confidence: supply?.confidenceLevel ?? "INSUFFICIENT",
      topCourses: top(courseMap, 5),
      topSkills: top(skillMap, 5),
    });
  }
  out.sort((a, b) => b.plannedCapacity - a.plannedCapacity);
  return ok({ districts: out });
}
