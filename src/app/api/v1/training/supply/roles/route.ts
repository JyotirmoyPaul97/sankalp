import { ok } from "@/lib/api";
import { getSupplyByRole } from "@/lib/intelligence/training";

/** GET /api/v1/training/supply/roles?districtId=&sectorId=&period= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const roles = await getSupplyByRole({
    districtId: url.searchParams.get("districtId") || undefined,
    sectorId: url.searchParams.get("sectorId") || undefined,
    period: url.searchParams.get("period") || undefined,
  });
  return ok({ roles });
}
