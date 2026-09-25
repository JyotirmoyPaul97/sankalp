import { ok, fail } from "@/lib/api";
import { getTrendSeries } from "@/lib/intelligence/market";

/** GET /api/v1/market-demand/trends?skillId=&jobRoleId=&sectorId=&districtId= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const skillId = url.searchParams.get("skillId") || undefined;
  const jobRoleId = url.searchParams.get("jobRoleId") || undefined;
  const sectorId = url.searchParams.get("sectorId") || undefined;
  const districtId = url.searchParams.get("districtId") || undefined;

  if (!skillId && !jobRoleId && !sectorId) {
    return fail("BAD_REQUEST", "Provide ?skillId=, ?jobRoleId=, or ?sectorId=");
  }
  const series = await getTrendSeries({ skillId, jobRoleId, sectorId, districtId });
  return ok({ series, methodology: "Aggregated from MarketSignal rows per period. Missing periods are NOT filled with zeros — they appear as gaps." });
}
