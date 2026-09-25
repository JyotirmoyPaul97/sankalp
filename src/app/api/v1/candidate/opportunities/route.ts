import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/v1/candidate/opportunities
 * Evidence-based opportunity matching. Every opportunity explains:
 *   Required Role · Required Skills · Required Proficiency ·
 *   Candidate Proficiency · Evidence Match · Remaining Gap.
 *
 * NOT a generic jobs feed. Matched on DEMONSTRATED capability + evidence,
 * not claimed skills.
 */
export async function GET(req: Request) {
  const payload = await requireUser(req);
  if (!payload) return fail("UNAUTHORIZED", "Authentication required");

  const candidate = await db.candidate.findUnique({
    where: { email: payload.email },
    include: {
      targetProfiles: { include: { jobRole: { include: { sector: true } } } },
      skills: { include: { skill: true } },
      opportunityReadiness: { include: { jobRole: true } },
      courseMatches: { include: { course: { include: { sector: true } } } },
    },
  });
  if (!candidate) return fail("NOT_FOUND", "No candidate profile linked to this account");

  const target = candidate.targetProfiles[0];
  if (!target) return ok({ opportunities: [], message: "No target role set" });

  const role = target.jobRole;

  // Role-required competencies (shared competency layer).
  const roleSkills = await db.roleSkill.findMany({ where: { jobRoleId: role.id }, include: { skill: true } });

  // Map candidate demonstrated skills.
  const demonstrated = new Map(candidate.skills.map((cs) => [cs.skillId, cs]));

  // Build per-skill comparison.
  const skillComparisons = roleSkills.map((rs) => {
    const cs = demonstrated.get(rs.skillId);
    return {
      skill: rs.skill.name,
      required: rs.proficiencyLevel,
      demonstrated: cs?.currentProficiency ?? null,
      evidenceCount: cs?.evidenceCount ?? 0,
      confidence: cs?.proficiencyConfidence ?? 0,
      freshness: cs?.freshnessStatus ?? "UNKNOWN",
      gap:
        cs?.currentProficiency === rs.proficiencyLevel ? "NONE"
        : cs?.currentProficiency ? "PROFICIENCY_GAP"
        : "MISSING_SKILL",
    };
  });

  const strengths = skillComparisons.filter((s) => s.gap === "NONE");
  const remainingGaps = skillComparisons.filter((s) => s.gap !== "NONE");

  const oppReadiness = candidate.opportunityReadiness.find((r) => r.targetRoleId === role.id);

  // Build opportunity objects (synthetic, derived from the intelligence engine).
  const opportunities = [
    {
      id: `opp-internship-${role.id}`,
      type: "INTERNSHIP",
      title: `${role.title} Internship`,
      employer: "Synthetic Employer — Advanced Manufacturing Partner",
      district: candidate.district?.name ?? "Maharashtra",
      matchStatus: oppReadiness?.overallReadinessSignal ?? "DEVELOPING",
      matchReason: strengths.length >= 1
        ? `Strong on ${strengths.map((s) => s.skill).join(", ")}. ${remainingGaps.length} remaining gap(s).`
        : "Insufficient demonstrated evidence for this role yet.",
      strengths: strengths.map((s) => ({ skill: s.skill, demonstrated: s.demonstrated, evidence: s.evidenceCount })),
      remainingGaps: remainingGaps.map((s) => ({ skill: s.skill, required: s.required, demonstrated: s.demonstrated, gap: s.gap })),
      evidenceMatch: {
        evidenceBacked: strengths.length,
        claimed: candidate.skills.length,
        note: "MATCHED ON DEMONSTRATED CAPABILITY, NOT CLAIMS.",
      },
    },
    {
      id: `opp-apprenticeship-${role.id}`,
      type: "APPRENTICESHIP",
      title: `${role.title} Apprenticeship`,
      employer: "Synthetic Employer — Industrial Automation Cluster",
      district: candidate.district?.name ?? "Maharashtra",
      matchStatus: oppReadiness && oppReadiness.highGapCount === 0 ? "READY_FOR_CONSIDERATION" : "DEVELOPING",
      matchReason: `Apprenticeships accept candidates in development. Close the HIGH priority gap for stronger match.`,
      strengths: strengths.map((s) => ({ skill: s.skill, demonstrated: s.demonstrated })),
      remainingGaps: remainingGaps.map((s) => ({ skill: s.skill, required: s.required, demonstrated: s.demonstrated, gap: s.gap })),
      evidenceMatch: { evidenceBacked: strengths.length, claimed: candidate.skills.length, note: "DEMONSTRATED EVIDENCE REQUIRED." },
    },
  ];

  return ok({
    targetRole: { id: role.id, title: role.title, sector: role.sector?.name ?? null },
    readiness: oppReadiness
      ? {
          signal: oppReadiness.overallReadinessSignal,
          roleReadiness: oppReadiness.roleReadiness,
          skillReadiness: oppReadiness.skillReadiness,
          evidenceReadiness: oppReadiness.evidenceReadiness,
          criticalGaps: oppReadiness.criticalGapCount,
          highGaps: oppReadiness.highGapCount,
        }
      : null,
    opportunities,
    claimedVsDemonstrated: {
      claimedSkills: candidate.skills.length,
      evidenceBackedSkills: candidate.skills.filter((cs) => cs.evidenceCount > 0).length,
      verifiedSkills: candidate.skills.filter((cs) => cs.status === "VERIFIED" || cs.status === "ASSESSED").length,
    },
  });
}
