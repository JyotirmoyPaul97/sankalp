import { ok } from "@/lib/api";
import { db } from "@/lib/db";
import { getMarketIntelligence } from "@/lib/intelligence/market";

/** GET /api/v1/market-demand/clusters — economic-cluster market intelligence */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || undefined;

  const clusters = await db.economicCluster.findMany({
    include: {
      district: true,
      sector: true,
      _count: { select: { employers: true, jobPostings: true } },
    },
  });
  const out = [];
  for (const c of clusters) {
    const intel = await getMarketIntelligence({ clusterId: c.id, period });
    // Top roles/skills in this cluster
    const sigs = await db.marketSignal.findMany({
      where: { clusterId: c.id },
      include: { jobRole: true, skill: true },
    });
    const roleMap = new Map<string, number>();
    const skillMap = new Map<string, number>();
    for (const s of sigs) {
      if (s.jobRole) roleMap.set(s.jobRole.title, (roleMap.get(s.jobRole.title) ?? 0) + s.signalValue);
      if (s.skill) skillMap.set(s.skill.name, (skillMap.get(s.skill.name) ?? 0) + s.signalValue);
    }
    const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ name: k, signal: v }));

    out.push({
      cluster: { id: c.id, name: c.name, code: c.code, district: c.district?.name ?? null, sector: c.sector?.name ?? null, clusterType: c.clusterType, employerCount: c._count.employers },
      demandSignal: intel?.signalLabel ?? "NONE",
      signalStrength: intel?.signalStrength ?? 0,
      trend: intel?.trendDirection ?? "UNKNOWN",
      confidence: intel?.confidenceLevel ?? "INSUFFICIENT",
      evidenceCount: intel?.evidenceCount ?? 0,
      sourceDiversity: intel?.sourceDiversity ?? 0,
      topRoles: top(roleMap, 5),
      topSkills: top(skillMap, 5),
    });
  }
  out.sort((a, b) => b.signalStrength - a.signalStrength);
  return ok({ clusters: out });
}
