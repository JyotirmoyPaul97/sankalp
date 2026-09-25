import { ok } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/training/supply/proficiency?skillId=&districtId= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const skillId = url.searchParams.get("skillId");
  if (!skillId) return ok({ distribution: null, message: "Provide ?skillId=" });

  // Aggregate proficiency from CourseSkill (expected proficiency) + CourseOffering enrollment
  const courseSkills = await db.courseSkill.findMany({
    where: { skillId },
    include: { course: { include: { courseOfferings: true } } },
  });
  if (courseSkills.length === 0) return ok({ distribution: null, message: "INSUFFICIENT_EVIDENCE", sampleSize: 0 });

  const dist: Record<string, number> = { AWARENESS: 0, WORKING: 0, PROFICIENT: 0, EXPERT: 0 };
  let totalCapacity = 0;
  for (const cs of courseSkills) {
    const level = cs.expectedProficiency ?? "WORKING";
    if (level in dist) dist[level]++;
    // Add capacity from offerings
    for (const off of cs.course.courseOfferings) {
      totalCapacity += off.plannedSeats;
    }
  }
  const total = courseSkills.length;
  const pct: Record<string, number> = {};
  for (const [k, v] of Object.entries(dist)) pct[k] = Math.round((v / total) * 100);

  return ok({
    skillId,
    distribution: pct,
    sampleSize: total,
    plannedCapacity: totalCapacity,
    methodology: "Aggregated from CourseSkill.expectedProficiency (Phase 5 extended mapping). Percentages only shown when source evidence supports them.",
  });
}
