import { ok } from "@/lib/api";
import { getGapsByRole } from "@/lib/intelligence/gap";

/** GET /api/v1/gaps/roles?districtId=&sectorId=&period= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const gaps = await getGapsByRole({
    districtId: url.searchParams.get("districtId") || undefined,
    sectorId: url.searchParams.get("sectorId") || undefined,
    period: url.searchParams.get("period") || undefined,
  });
  return ok({ roles: gaps });
}
