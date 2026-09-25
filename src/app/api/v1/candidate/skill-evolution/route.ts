import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/v1/candidate/skill-evolution
 * Returns a chronological timeline of evidence events for the logged-in
 * candidate — the "skill evolution" story (assessment → practice → project →
 * reassessment → employer feedback). Grouped by skill.
 */
export async function GET(req: Request) {
  const payload = await requireUser(req);
  if (!payload) return fail("UNAUTHORIZED", "Authentication required");

  const candidate = await db.candidate.findUnique({ where: { email: payload.email }, select: { id: true } });
  if (!candidate) return fail("NOT_FOUND", "No candidate profile linked to this account");

  const evidence = await db.candidateEvidence.findMany({
    where: { candidateId: candidate.id },
    include: { skill: true },
    orderBy: { evidenceTimestamp: "asc" },
  });

  const assessments = await db.candidateAssessment.findMany({
    where: { candidateId: candidate.id },
    include: { skill: true },
    orderBy: { assessedAt: "asc" },
  });

  const resolutions = await db.candidateGapResolutionEvent.findMany({
    where: { candidateId: candidate.id },
    orderBy: { timestamp: "asc" },
  });

  // Group evidence into per-skill timelines.
  const bySkill = new Map<string, { skillId: string; skillName: string; events: Array<{ date: string; type: string; source: string | null; proficiency: string; confidence: number; description: string | null; verified: boolean }> }>();

  for (const e of evidence) {
    if (!e.skillId) continue;
    const key = e.skillId;
    if (!bySkill.has(key)) bySkill.set(key, { skillId: key, skillName: e.skill?.name ?? "Unknown", events: [] });
    bySkill.get(key)!.events.push({
      date: e.evidenceTimestamp.toISOString(),
      type: e.evidenceType,
      source: e.evidenceSource,
      proficiency: e.proficiencyLevel,
      confidence: e.confidence,
      description: e.description,
      verified: e.verificationStatus === "VERIFIED",
    });
  }

  // Augment with assessments (treat as evidence events of type ASSESSED).
  for (const a of assessments) {
    if (!a.skillId) continue;
    const key = a.skillId;
    if (!bySkill.has(key)) bySkill.set(key, { skillId: key, skillName: a.skill?.name ?? "Unknown", events: [] });
    bySkill.get(key)!.events.push({
      date: a.assessedAt.toISOString(),
      type: "ASSESSMENT",
      source: a.assessmentType,
      proficiency: a.proficiencyLevel,
      confidence: a.confidence,
      description: `Formal assessment — score ${a.score ? Math.round(a.score) : "—"}.`,
      verified: true,
    });
  }

  // Sort each skill's events and compute progression snapshots.
  const skills = Array.from(bySkill.values()).map((s) => {
    const events = s.events.sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
    const progression = events.map((ev, i) => ({ date: ev.date, proficiency: ev.proficiency, label: ev.type, index: i }));
    return { ...s, events, progression };
  });

  return ok({
    skills,
    resolutionEvents: resolutions.map((r) => ({
      id: r.id,
      gapId: r.gapId,
      actionType: r.actionType,
      evidenceId: r.evidenceId,
      previousStatus: r.previousStatus,
      newStatus: r.newStatus,
      timestamp: r.timestamp.toISOString(),
    })),
  });
}
