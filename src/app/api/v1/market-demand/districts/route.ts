import { ok } from "@/lib/api";
import { db } from "@/lib/db";
import { getMarketIntelligence } from "@/lib/intelligence/market";

/** GET /api/v1/market-demand/districts — district-level market intelligence */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || undefined;

  const districts = await db.district.findMany({
    include: {
      division: true,
      _count: { select: { employers: true, economicClusters: true, institutions: true } },
    },
  });
  const out = [];
  for (const d of districts) {
    const intel = await getMarketIntelligence({ districtId: d.id, period });
    // Top sectors/roles/skills by signal strength in this district
    const sigs = await db.marketSignal.findMany({
      where: { districtId: d.id },
      include: { sector: true, jobRole: true, skill: true },
    });
    const sectorMap = new Map<string, number>();
    const roleMap = new Map<string, number>();
    const skillMap = new Map<string, number>();
    for (const s of sigs) {
      if (s.sectorId) sectorMap.set(s.sector.name!, (sectorMap.get(s.sector.name!) ?? 0) + s.signalValue);
      if (s.jobRole) roleMap.set(s.jobRole.title, (roleMap.get(s.jobRole.title) ?? 0) + s.signalValue);
      if (s.skill) skillMap.set(s.skill.name, (skillMap.get(s.skill.name) ?? 0) + s.signalValue);
    }
    const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ name: k, signal: v }));

    out.push({
      district: { id: d.id, name: d.name, code: d.code, division: d.division?.name ?? null, employerCount: d._count.employers, clusterCount: d._count.economicClusters, institutionCount: d._count.institutions },
      demandSignal: intel?.signalLabel ?? "NONE",
      signalStrength: intel?.signalStrength ?? 0,
      trend: intel?.trendDirection ?? "UNKNOWN",
      confidence: intel?.confidenceLevel ?? "INSUFFICIENT",
      evidenceCount: intel?.evidenceCount ?? 0,
      sourceDiversity: intel?.sourceDiversity ?? 0,
      topSectors: top(sectorMap, 5),
      topRoles: top(roleMap, 5),
      topSkills: top(skillMap, 5),
      dataFreshness: intel?.dataFreshness ?? "UNKNOWN",
    });
  }
  out.sort((a, b) => b.signalStrength - a.signalStrength);
  return ok({ districts: out });
}
