import { ok } from "@/lib/api";
import { getGapMatrix } from "@/lib/intelligence/gap";

/** GET /api/v1/gaps/matrix?districtId=&sectorId=&period= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const matrix = await getGapMatrix({
    districtId: url.searchParams.get("districtId") || undefined,
    sectorId: url.searchParams.get("sectorId") || undefined,
    period: url.searchParams.get("period") || undefined,
  });
  return ok({ matrix });
}
