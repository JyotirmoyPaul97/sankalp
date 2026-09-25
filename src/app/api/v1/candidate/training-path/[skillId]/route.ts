import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/v1/candidate/training-path/[skillId]
 * Maps a candidate's skill gap → relevant course → curriculum → training centre
 * → trainer capability → equipment readiness. Evidence-based development path.
 */
export async function GET(req: Request, ctx: { params: Promise<{ skillId: string }> }) {
  const payload = await requireUser(req);
  if (!payload) return fail("UNAUTHORIZED", "Authentication required");

  const { skillId } = await ctx.params;
  const candidate = await db.candidate.findUnique({
    where: { email: payload.email },
    include: { targetProfiles: { include: { jobRole: true } } },
  });
  if (!candidate) return fail("NOT_FOUND", "No candidate profile linked to this account");

  // Candidate's gap for this skill (if any).
  const targetRoleId = candidate.targetProfiles[0]?.targetRoleId ?? null;
  const gap = targetRoleId
    ? await db.candidateSkillGap.findFirst({ where: { candidateId: candidate.id, skillId, targetRoleId }, include: { skill: true } })
    : null;

  // Candidate's course matches for this skill (precomputed by the intelligence engine).
  const courseMatches = targetRoleId
    ? await db.candidateCourseMatch.findMany({
        where: { candidateId: candidate.id, targetRoleId },
        include: { course: { include: { sector: true, courseSkills: { include: { skill: true } } } } },
      })
    : [];

  // Filter to matches whose course actually covers this skill.
  const relevant = courseMatches.filter((m) => m.course.courseSkills.some((cs) => cs.skillId === skillId));

  // For each relevant course, resolve training centres + trainer + equipment.
  const enriched = await Promise.all(relevant.slice(0, 3).map(async (m) => {
    const offerings = await db.courseOffering.findMany({
      where: { courseId: m.courseId },
      include: {
        trainingCentre: { include: { district: true, institution: true } },
      },
      take: 5,
    });
    return {
      courseMatch: {
        id: m.id,
        matchStatus: m.matchStatus,
        matchConfidence: m.matchConfidence,
        courseRelevance: m.courseRelevance,
        matchReason: m.matchReason,
        centreReadiness: m.centreReadiness,
        trainerCapability: m.trainerCapability,
        equipmentCapability: m.equipmentCapability,
        capacityAvailability: m.capacityAvailability,
        geographicAccess: m.geographicAccess,
      },
      course: {
        id: m.course.id,
        name: m.course.name,
        sector: m.course.sector?.name ?? null,
        skillsCovered: m.course.courseSkills.map((cs) => ({ name: cs.skill.name, proficiency: cs.expectedProficiency ?? cs.coverageLevel })),
      },
      centres: offerings.map((o) => ({
        name: o.trainingCentre?.name ?? "—",
        district: o.trainingCentre?.district?.name ?? "—",
        institution: o.trainingCentre?.institution?.name ?? null,
        capacity: o.plannedSeats,
        availableSeats: o.availableSeats,
        period: o.periodLabel,
        status: o.status,
      })),
    };
  }));

  return ok({
    skill: gap?.skill ? { id: gap.skill.id, name: gap.skill.name } : (await db.skill.findUnique({ where: { id: skillId }, select: { id: true, name: true } })),
    gap: gap
      ? { id: gap.id, required: gap.requiredProficiency, current: gap.candidateProficiency, severity: gap.gapSeverity, status: gap.status }
      : null,
    trainingOptions: enriched,
  });
}
