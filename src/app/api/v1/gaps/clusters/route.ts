import { ok } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/gaps/clusters — cluster-level gap summaries */
export async function GET() {
  const clusters = await db.economicCluster.findMany({
    include: { district: true, sector: true },
  });
  const out = [];
  for (const c of clusters) {
    // Gaps in this cluster's district + sector
    const gaps = await db.demandSupplyGapSignal.findMany({
      where: {
        districtId: c.districtId ?? undefined,
        sectorId: c.sectorId ?? undefined,
      },
      orderBy: { gapScore: "desc" },
      include: { skill: true, jobRole: true },
    });
    const highGaps = gaps.filter((g) => g.gapSignal === "HIGH_GAP" || g.gapSignal === "MODERATE_GAP");
    out.push({
      cluster: { id: c.id, name: c.name, district: c.district?.name ?? null, sector: c.sector?.name ?? null },
      totalGaps: gaps.length,
      highGapCount: highGaps.length,
      topGapSkills: highGaps.filter((g) => g.skillId).slice(0, 5).map((g) => ({
        id: g.id, skill: g.skill?.name ?? "—", gapSignal: g.gapSignal, gapScore: g.gapScore, confidence: g.confidenceLevel,
      })),
      topGapRoles: highGaps.filter((g) => g.jobRoleId && !g.skillId).slice(0, 5).map((g) => ({
        id: g.id, role: g.jobRole?.title ?? "—", gapSignal: g.gapSignal, gapScore: g.gapScore, confidence: g.confidenceLevel,
      })),
    });
  }
  out.sort((a, b) => b.highGapCount - a.highGapCount);
  return ok({ clusters: out });
}
