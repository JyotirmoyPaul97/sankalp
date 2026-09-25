import { ok } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/gaps/districts — district-level gap summaries */
export async function GET() {
  const districts = await db.district.findMany();
  const out = [];
  for (const d of districts) {
    const gaps = await db.demandSupplyGapSignal.findMany({
      where: { districtId: d.id },
      orderBy: { gapScore: "desc" },
      include: { skill: true, jobRole: true },
    });
    const highGaps = gaps.filter((g) => g.gapSignal === "HIGH_GAP" || g.gapSignal === "MODERATE_GAP");
    const proficiencyMismatches = gaps.filter((g) => g.gapSignal === "PROFICIENCY_MISMATCH");
    const geographicGaps = gaps.filter((g) => g.gapSignal === "GEOGRAPHIC_GAP");
    const noSupply = gaps.filter((g) => g.gapSignal === "NO_IDENTIFIED_SUPPLY");
    const covered = gaps.filter((g) => g.gapSignal === "SUPPLY_PRESENT" || g.gapSignal === "LOW_GAP");

    out.push({
      district: { id: d.id, name: d.name },
      totalGaps: gaps.length,
      highGapCount: highGaps.length,
      proficiencyMismatchCount: proficiencyMismatches.length,
      geographicGapCount: geographicGaps.length,
      noSupplyCount: noSupply.length,
      coveredCount: covered.length,
      topGaps: highGaps.slice(0, 5).map((g) => ({
        id: g.id,
        skill: g.skill?.name ?? g.jobRole?.title ?? "—",
        gapSignal: g.gapSignal,
        gapScore: g.gapScore,
        confidence: g.confidenceLevel,
        marketDemand: g.marketDemandSignal,
        trainingSupply: g.trainingSupplySignal,
      })),
    });
  }
  out.sort((a, b) => b.highGapCount - a.highGapCount);
  return ok({ districts: out });
}
