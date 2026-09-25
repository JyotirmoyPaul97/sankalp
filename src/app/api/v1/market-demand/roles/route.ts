import { ok } from "@/lib/api";
import { db } from "@/lib/db";
import { getMarketIntelligence } from "@/lib/intelligence/market";

/**
 * GET /api/v1/market-demand/roles
 * Demand intelligence by role. Filters: district, sector, cluster, period.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const districtId = url.searchParams.get("district") || undefined;
  const sectorId = url.searchParams.get("sector") || undefined;
  const clusterId = url.searchParams.get("cluster") || undefined;
  const period = url.searchParams.get("period") || undefined;

  const roles = await db.jobRole.findMany({
    include: { sector: true, _count: { select: { roleSkills: true } } },
  });

  const out = [];
  for (const role of roles) {
    const intel = await getMarketIntelligence({
      districtId: districtId ?? undefined,
      sectorId: role.sectorId ?? sectorId,
      clusterId: clusterId ?? undefined,
      jobRoleId: role.id,
      period,
    });
    out.push({
      role: { id: role.id, title: role.title, sector: role.sector?.name ?? null, competencyCount: role._count.roleSkills },
      demandSignal: intel?.signalLabel ?? "NONE",
      signalStrength: intel?.signalStrength ?? 0,
      trend: intel?.trendDirection ?? "UNKNOWN",
      confidence: intel?.confidenceLevel ?? "INSUFFICIENT",
      evidenceCount: intel?.evidenceCount ?? 0,
      sourceDiversity: intel?.sourceDiversity ?? 0,
      uniqueEmployers: intel?.uniqueEmployers ?? 0,
      uniquePostings: intel?.uniquePostings ?? 0,
      geographicCoverage: intel?.scope ?? "STATE",
    });
  }
  // Sort by signal strength desc
  out.sort((a, b) => b.signalStrength - a.signalStrength);
  return ok({ roles: out });
}
