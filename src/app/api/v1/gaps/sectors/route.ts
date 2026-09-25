import { ok } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/gaps/sectors — sector-level gap summaries */
export async function GET() {
  const sectors = await db.sector.findMany();
  const out = [];
  for (const s of sectors) {
    const gaps = await db.demandSupplyGapSignal.findMany({
      where: { sectorId: s.id },
      orderBy: { gapScore: "desc" },
      include: { skill: true, jobRole: true },
    });
    const highGaps = gaps.filter((g) => g.gapSignal === "HIGH_GAP" || g.gapSignal === "MODERATE_GAP");
    out.push({
      sector: { id: s.id, name: s.name },
      totalGaps: gaps.length,
      highGapCount: highGaps.length,
      topGaps: highGaps.slice(0, 5).map((g) => ({
        id: g.id,
        entity: g.skill?.name ?? g.jobRole?.title ?? "—",
        gapSignal: g.gapSignal,
        gapScore: g.gapScore,
        confidence: g.confidenceLevel,
      })),
    });
  }
  out.sort((a, b) => b.highGapCount - a.highGapCount);
  return ok({ sectors: out });
}
