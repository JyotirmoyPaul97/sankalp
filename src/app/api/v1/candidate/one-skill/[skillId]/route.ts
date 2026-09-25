import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/v1/candidate/one-skill/[skillId]
 * Unified candidate-facing one-skill view:
 *   MARKET · ROLE · REQUIRED · DEMONSTRATED · EVIDENCE · GAP · PATH · OUTCOME
 *
 * Aggregates from the shared Skill Intelligence Engine — does not invent a
 * parallel candidate ontology.
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

  const targetRoleId = candidate.targetProfiles[0]?.targetRoleId ?? null;

  const skill = await db.skill.findUnique({ where: { id: skillId } });
  if (!skill) return fail("NOT_FOUND", "Skill not found");

  const [candidateSkill, evidence, gap, marketSignal, emerging] = await Promise.all([
    db.candidateSkill.findUnique({ where: { candidateId_skillId: { candidateId: candidate.id, skillId } } }),
    db.candidateEvidence.findMany({ where: { candidateId: candidate.id, skillId }, orderBy: { evidenceTimestamp: "desc" } }),
    targetRoleId ? db.candidateSkillGap.findFirst({ where: { candidateId: candidate.id, skillId, targetRoleId } }) : null,
    db.marketSignal.findFirst({ where: { skillId }, orderBy: { periodLabel: "desc" } }),
    db.emergingSkillSignal.findFirst({ where: { skillId }, orderBy: { updatedAt: "desc" } }),
  ]);

  const priority = gap ? await db.candidateGapPriority.findFirst({ where: { candidateId: candidate.id, gapId: gap.id } }) : null;

  // Role-required proficiency (from shared competency).
  let requiredProficiency: string | null = null;
  if (targetRoleId) {
    const rs = await db.roleSkill.findFirst({ where: { jobRoleId: targetRoleId, skillId } });
    requiredProficiency = rs?.proficiencyLevel ?? null;
  }

  // Development pathway steps targeting this skill.
  const devSteps = await db.developmentPathwayStep.findMany({
    where: { pathway: { candidateId: candidate.id, targetRoleId: targetRoleId ?? "_none_" }, skillId },
    orderBy: { sequence: "asc" },
    include: { course: true },
  });

  return ok({
    skill: { id: skill.id, name: skill.name, canonicalName: skill.canonicalName, category: skill.category, description: skill.description },
    market: {
      signalValue: marketSignal?.signalValue ?? null,
      direction: marketSignal?.direction ?? null,
      confidence: marketSignal?.confidence ?? null,
      periodLabel: marketSignal?.periodLabel ?? null,
      emergingSignal: emerging ? { status: emerging.emergenceStatus, strength: emerging.signalStrength, trendVelocity: emerging.trendVelocity } : null,
    },
    role: targetRoleId ? { id: targetRoleId, title: candidate.targetProfiles[0]?.jobRole.title ?? null } : null,
    required: { proficiency: requiredProficiency ?? gap?.requiredProficiency ?? null },
    demonstrated: candidateSkill
      ? {
          proficiency: candidateSkill.currentProficiency,
          confidence: candidateSkill.proficiencyConfidence,
          evidenceCount: candidateSkill.evidenceCount,
          freshness: candidateSkill.freshnessStatus,
          status: candidateSkill.status,
          lastVerifiedAt: candidateSkill.lastVerifiedAt,
          lastAssessedAt: candidateSkill.lastAssessedAt,
        }
      : null,
    evidence: evidence.map((e) => ({
      id: e.id, type: e.evidenceType, source: e.evidenceSource, timestamp: e.evidenceTimestamp.toISOString(),
      proficiency: e.proficiencyLevel, verification: e.verificationStatus, confidence: e.confidence, description: e.description,
    })),
    gap: gap
      ? {
          id: gap.id, type: gap.gapType, severity: gap.gapSeverity, status: gap.status,
          required: gap.requiredProficiency, current: gap.candidateProficiency,
          candidateEvidenceConfidence: gap.candidateEvidenceConfidence,
          marketRequirementConfidence: gap.marketRequirementConfidence,
          evidenceCount: gap.evidenceCount, freshness: gap.freshness,
        }
      : null,
    priority: priority
      ? {
          signal: priority.prioritySignal, reason: priority.priorityReason,
          marketImportance: priority.marketImportance, employerSignal: priority.employerSignal,
          emergingSignal: priority.emergingSignal, trainingAvailability: priority.trainingAvailability,
        }
      : null,
    developmentPath: devSteps.map((s) => ({
      id: s.id, sequence: s.sequence, actionType: s.actionType, status: s.status,
      objective: s.objective, evidenceRequired: s.evidenceRequired,
      course: s.course ? { id: s.course.id, name: s.course.name } : null,
    })),
  });
}
