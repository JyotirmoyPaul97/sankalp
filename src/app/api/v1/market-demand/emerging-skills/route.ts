import { ok } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/market-demand/emerging-skills — Emerging Skill Radar */
export async function GET() {
  const entries = await db.emergingSkillSignal.findMany({
    include: { skill: true },
    orderBy: [{ signalStrength: "desc" }],
  });
  return ok({
    entries: entries.map((e) => ({
      skillId: e.skillId,
      skillName: e.skill.name,
      emergenceStatus: e.emergenceStatus,
      signalStrength: e.signalStrength,
      recentActivity: e.recentActivity,
      trendVelocity: e.trendVelocity,
      persistence: e.persistence,
      sourceDiversity: e.sourceDiversity,
      technologyLink: e.technologyLink,
      firstObserved: e.firstObserved,
      confidence: e.confidence,
      evidenceCount: e.evidenceCount,
    })),
    disclaimer: "Emerging signal — observed evidence of change, NOT a guaranteed future demand forecast.",
  });
}
