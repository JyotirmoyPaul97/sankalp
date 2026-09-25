import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { getMarketIntelligence } from "@/lib/intelligence/market";
import { getRoleCompetencyProfile } from "@/lib/intelligence/competency";

/**
 * GET /api/v1/market-demand/aspiration-context?targetRoleId=&targetSectorId=&districtId=
 * Returns market context for a candidate aspiration. NO recommendations.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const targetRoleId = url.searchParams.get("targetRoleId");
  const targetSectorId = url.searchParams.get("targetSectorId");
  const districtId = url.searchParams.get("districtId");

  if (!targetRoleId) return fail("BAD_REQUEST", "targetRoleId is required");

  const intel = await getMarketIntelligence({
    jobRoleId: targetRoleId,
    sectorId: targetSectorId ?? undefined,
    districtId: districtId ?? undefined,
  });

  // Required competencies from Phase 3
  const competencyProfile = await getRoleCompetencyProfile(targetRoleId);

  // Employer signals in scope
  const employers = await db.employer.findMany({
    where: {
      ...(targetSectorId ? { industrySectorId: targetSectorId } : {}),
      ...(districtId ? { districtId } : {}),
    },
    take: 20,
    select: { id: true, name: true, sizeCategory: true, isVerified: true },
  });

  // Cluster presence
  const clusters = districtId
    ? await db.economicCluster.findMany({ where: { districtId }, include: { sector: true, _count: { select: { employers: true } } } })
    : [];

  return ok({
    aspiration: {
      targetRoleId,
      targetSectorId,
      districtId,
    },
    marketContext: {
      observedDemand: intel?.signalLabel ?? "NONE",
      trend: intel?.trendDirection ?? "UNKNOWN",
      confidence: intel?.confidenceLevel ?? "INSUFFICIENT",
      evidenceCount: intel?.evidenceCount ?? 0,
      sourceDiversity: intel?.sourceDiversity ?? 0,
    },
    requiredSkills: competencyProfile?.competencies.map((c) => ({
      skill: c.skillName,
      canonicalName: c.canonicalName,
      importance: c.importance,
      proficiencyExpected: c.proficiencyExpected,
    })) ?? [],
    requiredProficiency: competencyProfile?.byProficiency ?? null,
    employerSignals: employers,
    clusterPresence: clusters.map((c) => ({ id: c.id, name: c.name, sector: c.sector?.name ?? null, employerCount: c._count.employers })),
    sectorPresence: intel?.sectorName ?? null,
    disclaimer: "Market context only — NO career recommendation. Decisions remain with the candidate.",
  });
}
