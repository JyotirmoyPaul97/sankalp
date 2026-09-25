import { ok } from "@/lib/api";
import { db } from "@/lib/db";
import { getMarketIntelligence } from "@/lib/intelligence/market";

/** GET /api/v1/market-demand/sectors — sector-level demand intelligence */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const districtId = url.searchParams.get("district") || undefined;
  const period = url.searchParams.get("period") || undefined;

  const sectors = await db.sector.findMany({ include: { _count: { select: { employers: true, courses: true, jobRoles: true } } } });
  const out = [];
  for (const sector of sectors) {
    const intel = await getMarketIntelligence({ districtId, sectorId: sector.id, period });
    // Sector growth profile
    const growth = await db.sectorGrowthProfile.findFirst({ where: { sectorId: sector.id }, orderBy: { period: "desc" } });
    out.push({
      sector: { id: sector.id, name: sector.name, code: sector.code, employerCount: sector._count.employers, courseCount: sector._count.courses, roleCount: sector._count.jobRoles },
      demandSignal: intel?.signalLabel ?? "NONE",
      signalStrength: intel?.signalStrength ?? 0,
      trend: intel?.trendDirection ?? "UNKNOWN",
      growthDirection: growth?.growthDirection ?? "INSUFFICIENT_DATA",
      observedGrowth: growth?.observedGrowth ?? null,
      confidence: intel?.confidenceLevel ?? "INSUFFICIENT",
      evidenceCount: intel?.evidenceCount ?? 0,
      sourceDiversity: intel?.sourceDiversity ?? 0,
    });
  }
  out.sort((a, b) => b.signalStrength - a.signalStrength);
  return ok({ sectors: out });
}
