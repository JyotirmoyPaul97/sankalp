import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { getMarketIntelligence } from "@/lib/intelligence/market";

/**
 * GET /api/v1/market-demand/market-profile/[scope]/[id]
 * scope ∈ {state, district, cluster, sector}
 */
export async function GET(_req: Request, ctx: { params: Promise<{ scope: string; id: string }> }) {
  const { scope, id } = await ctx.params;
  const scopeUpper = scope.toUpperCase();

  if (!["STATE", "DISTRICT", "CLUSTER", "SECTOR"].includes(scopeUpper)) {
    return fail("BAD_REQUEST", "Scope must be one of: state, district, cluster, sector");
  }

  if (scopeUpper === "STATE") {
    const intel = await getMarketIntelligence({});
    return ok(intel);
  }
  if (scopeUpper === "DISTRICT") {
    const intel = await getMarketIntelligence({ districtId: id });
    const sigs = await db.marketSignal.findMany({ where: { districtId: id }, include: { sector: true, jobRole: true, skill: true } });
    return ok({ ...intel, topSectors: topEntities(sigs, "sector"), topRoles: topEntities(sigs, "role"), topSkills: topEntities(sigs, "skill") });
  }
  if (scopeUpper === "CLUSTER") {
    const intel = await getMarketIntelligence({ clusterId: id });
    const sigs = await db.marketSignal.findMany({ where: { clusterId: id }, include: { sector: true, jobRole: true, skill: true } });
    return ok({ ...intel, topSectors: topEntities(sigs, "sector"), topRoles: topEntities(sigs, "role"), topSkills: topEntities(sigs, "skill") });
  }
  if (scopeUpper === "SECTOR") {
    const intel = await getMarketIntelligence({ sectorId: id });
    const sigs = await db.marketSignal.findMany({ where: { sectorId: id }, include: { jobRole: true, skill: true } });
    return ok({ ...intel, topRoles: topEntities(sigs, "role"), topSkills: topEntities(sigs, "skill") });
  }
  return fail("BAD_REQUEST", "Invalid scope");
}

function topEntities(sigs: Array<{ signalValue: number; sector: { name: string } | null; jobRole: { title: string } | null; skill: { name: string } | null }>, kind: "sector" | "role" | "skill") {
  const map = new Map<string, number>();
  for (const s of sigs) {
    const name = kind === "sector" ? s.sector?.name : kind === "role" ? s.jobRole?.title : s.skill?.name;
    if (!name) continue;
    map.set(name, (map.get(name) ?? 0) + s.signalValue);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, signal]) => ({ name, signal }));
}
