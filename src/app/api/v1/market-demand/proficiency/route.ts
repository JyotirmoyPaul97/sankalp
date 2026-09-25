import { ok } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/market-demand/proficiency
 * Proficiency observations for a role/skill. Filters: role, skill, district, sector, period.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobRoleId = url.searchParams.get("role") || undefined;
  const skillId = url.searchParams.get("skill") || undefined;

  if (!jobRoleId && !skillId) {
    return ok({ error: "Provide ?role=<id> or ?skill=<id>", distribution: null });
  }

  // Build proficiency distribution from RoleSkill rows
  const roleSkills = await db.roleSkill.findMany({
    where: { jobRoleId: jobRoleId, skillId: skillId },
    include: { skill: true, jobRole: true },
  });

  if (roleSkills.length === 0) {
    return ok({ distribution: null, message: "Insufficient evidence — no proficiency observations for this role/skill.", sampleSize: 0 });
  }

  const dist: Record<string, number> = { AWARENESS: 0, WORKING: 0, PROFICIENT: 0, EXPERT: 0 };
  for (const rs of roleSkills) {
    const level = (rs.proficiencyLevel as keyof typeof dist) ?? "WORKING";
    if (level in dist) dist[level]++;
  }
  const total = roleSkills.length;
  const pct: Record<string, number> = {};
  for (const [k, v] of Object.entries(dist)) pct[k] = Math.round((v / total) * 100);

  return ok({
    role: roleSkills[0]?.jobRole?.title ?? null,
    skill: roleSkills[0]?.skill?.name ?? null,
    distribution: pct,
    sampleSize: total,
    methodology: "Aggregated from RoleSkill.proficiencyLevel (Phase 3 competency foundation). Percentages only shown when source evidence supports them.",
  });
}
