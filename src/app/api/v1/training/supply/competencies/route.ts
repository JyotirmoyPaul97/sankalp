import { ok } from "@/lib/api";
import { getSupplyByCompetency } from "@/lib/intelligence/training";

/** GET /api/v1/training/supply/competencies?districtId=&period= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const competencies = await getSupplyByCompetency({
    districtId: url.searchParams.get("districtId") || undefined,
    period: url.searchParams.get("period") || undefined,
  });
  return ok({ competencies });
}
