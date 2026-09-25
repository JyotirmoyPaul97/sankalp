import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/v1/candidate/aggregated
 * Aggregated candidate intelligence — how THIS candidate's capability
 * compares to the wider candidate population per skill. Privacy-preserving:
 * population counts only, no individual identities.
 *
 * This is the channel through which candidate evidence contributes to the
 * shared intelligence loop (district skill supply, market-training analysis).
 */
export async function GET(req: Request) {
  const payload = await requireUser(req);
  if (!payload) return fail("UNAUTHORIZED", "Authentication required");

  const candidate = await db.candidate.findUnique({
    where: { email: payload.email },
    include: { skills: { include: { skill: true } }, targetProfiles: { include: { jobRole: true } } },
  });
  if (!candidate) return fail("NOT_FOUND", "No candidate profile linked to this account");

  const targetRole = candidate.targetProfiles[0]?.jobRole;

  // For each of this candidate's skills, compute population distribution.
  const skillIds = candidate.skills.map((cs) => cs.skillId);
  const population = await db.candidateSkill.groupBy({
    by: ["skillId", "currentProficiency"],
    where: { skillId: { in: skillIds } },
    _count: { _all: true },
  });

  const skillAggregates = candidate.skills.map((cs) => {
    const dist: Record<string, number> = {};
    for (const p of population.filter((p) => p.skillId === cs.skillId)) {
      dist[p.currentProficiency] = (dist[p.currentProficiency] ?? 0) + p._count._all;
    }
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    return {
      skill: cs.skill.name,
      candidateProficiency: cs.currentProficiency,
      populationTotal: total,
      populationByProficiency: dist,
      candidatePercentile: total > 0 ? Math.round(((dist[cs.currentProficiency] ?? 0) / total) * 100) : null,
    };
  });

  return ok({
    candidateId: candidate.id,
    targetRole: targetRole ? { id: targetRole.id, title: targetRole.title } : null,
    skillAggregates,
    populationSummary: {
      totalCandidatesInSystem: await db.candidate.count(),
      candidatesSharingMySkills: await db.candidateSkill.findMany({ where: { skillId: { in: skillIds } }, select: { candidateId: true, skillId: true } }).then((rows) => new Set(rows.map((r) => r.candidateId)).size),
    },
    contribution: {
      message: "Your verified evidence contributes to aggregated district skill supply & market-training analysis. No individual identities are exposed in aggregated views.",
      evidenceCount: await db.candidateEvidence.count({ where: { candidateId: candidate.id } }),
    },
  });
}
