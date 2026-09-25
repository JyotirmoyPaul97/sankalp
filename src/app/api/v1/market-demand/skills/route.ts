import { ok } from "@/lib/api";
import { db } from "@/lib/db";
import { getMarketIntelligence } from "@/lib/intelligence/market";

/**
 * GET /api/v1/market-demand/skills
 * Demand intelligence by skill. Filters: district, sector, cluster, role, period.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const districtId = url.searchParams.get("district") || undefined;
  const sectorId = url.searchParams.get("sector") || undefined;
  const clusterId = url.searchParams.get("cluster") || undefined;
  const jobRoleId = url.searchParams.get("role") || undefined;
  const period = url.searchParams.get("period") || undefined;

  const skills = await db.skill.findMany({ include: { _count: { select: { roleSkills: true, courseSkills: true } } } });
  const out = [];
  for (const skill of skills) {
    const intel = await getMarketIntelligence({
      districtId: districtId ?? undefined,
      sectorId: sectorId ?? undefined,
      clusterId: clusterId ?? undefined,
      jobRoleId: jobRoleId ?? undefined,
      skillId: skill.id,
      period,
    });
    // Get district/cluster/sector counts from MarketSignal
    const sigs = await db.marketSignal.findMany({ where: { skillId: skill.id }, select: { districtId: true, clusterId: true, sectorId: true } });
    const districtCount = new Set(sigs.map((s) => s.districtId).filter(Boolean)).size;
    const clusterCount = new Set(sigs.map((s) => s.clusterId).filter(Boolean)).size;
    const sectorCount = new Set(sigs.map((s) => s.sectorId).filter(Boolean)).size;

    out.push({
      skill: { id: skill.id, name: skill.name, canonicalName: skill.canonicalName, category: skill.category, roleLinkages: skill._count.roleSkills, courseLinkages: skill._count.courseSkills },
      demandSignal: intel?.signalLabel ?? "NONE",
      signalStrength: intel?.signalStrength ?? 0,
      trend: intel?.trendDirection ?? "UNKNOWN",
      requiredProficiency: intel?.proficiencyDistribution ?? null,
      confidence: intel?.confidenceLevel ?? "INSUFFICIENT",
      evidenceCount: intel?.evidenceCount ?? 0,
      sourceDiversity: intel?.sourceDiversity ?? 0,
      uniqueEmployers: intel?.uniqueEmployers ?? 0,
      districtCount,
      clusterCount,
      sectorCount,
    });
  }
  out.sort((a, b) => b.signalStrength - a.signalStrength);
  return ok({ skills: out });
}
