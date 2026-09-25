import { ok } from "@/lib/api";
import { getGapsBySkill } from "@/lib/intelligence/gap";

/** GET /api/v1/gaps/skills?districtId=&sectorId=&period= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const gaps = await getGapsBySkill({
    districtId: url.searchParams.get("districtId") || undefined,
    sectorId: url.searchParams.get("sectorId") || undefined,
    period: url.searchParams.get("period") || undefined,
  });
  return ok({ skills: gaps });
}
