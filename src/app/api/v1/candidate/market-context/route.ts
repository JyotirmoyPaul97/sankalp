import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/v1/candidate/market-context
 * Market context for the candidate's target role + related emerging skills.
 * Reuses the Market Intelligence Engine — does not duplicate it.
 */
export async function GET(req: Request) {
  const payload = await requireUser(req);
  if (!payload) return fail("UNAUTHORIZED", "Authentication required");

  const candidate = await db.candidate.findUnique({
    where: { email: payload.email },
    include: { targetProfiles: { include: { jobRole: { include: { sector: true } } } } },
  });
  if (!candidate) return fail("NOT_FOUND", "No candidate profile linked to this account");

  const target = candidate.targetProfiles[0];
  if (!target) return ok({ role: null, demand: null, districts: [], emerging: [], message: "No target role set" });

  const roleId = target.targetRoleId;
  const role = target.jobRole;

  // Market signals for this role / sector.
  const roleSignals = await db.marketSignal.findMany({
    where: { jobRoleId: roleId },
    orderBy: { periodLabel: "desc" },
    take: 12,
  });
  const sectorSignals = await db.marketSignal.findMany({
    where: { sectorId: role.sectorId },
    orderBy: { periodLabel: "desc" },
    take: 12,
  });

  // Districts where this role/sector has demand.
  const districtIds = new Set<string>();
  for (const s of roleSignals) if (s.districtId) districtIds.add(s.districtId);
  for (const s of sectorSignals) if (s.districtId) districtIds.add(s.districtId);
  const districts = districtIds.size
    ? await db.district.findMany({ where: { id: { in: Array.from(districtIds) } }, select: { id: true, name: true } })
    : [];

  // Emerging skills related to this role's skills.
  const roleSkills = await db.roleSkill.findMany({ where: { jobRoleId: roleId }, include: { skill: true } });
  const skillIds = roleSkills.map((rs) => rs.skillId);
  const emerging = await db.emergingSkillSignal.findMany({
    where: { skillId: { in: skillIds } },
    include: { skill: true },
  });

  const latestRoleSignal = roleSignals[0];
  const direction = latestRoleSignal?.direction ?? "STABLE";
  const demandLevel =
    latestRoleSignal ? (latestRoleSignal.signalValue >= 50 ? "HIGH" : latestRoleSignal.signalValue >= 20 ? "MEDIUM" : "LOW") : null;

  return ok({
    role: { id: role.id, title: role.title, description: role.description, sector: role.sector?.name ?? null },
    demand: {
      level: demandLevel,
      trend: direction,
      signalValue: latestRoleSignal?.signalValue ?? null,
      confidence: latestRoleSignal?.confidence ?? null,
      period: latestRoleSignal?.periodLabel ?? null,
    },
    districts: districts.map((d) => d.name),
    emerging: emerging.map((e) => ({
      skill: e.skill.name,
      status: e.emergenceStatus,
      strength: e.signalStrength,
      trendVelocity: e.trendVelocity,
    })),
    requiredSkills: roleSkills.map((rs) => ({ name: rs.skill.name, required: rs.proficiencyLevel, importance: rs.importance })),
  });
}
