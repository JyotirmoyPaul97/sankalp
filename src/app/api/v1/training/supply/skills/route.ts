import { ok } from "@/lib/api";
import { getSupplyBySkill } from "@/lib/intelligence/training";

/** GET /api/v1/training/supply/skills?districtId=&sectorId=&period= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const skills = await getSupplyBySkill({
    districtId: url.searchParams.get("districtId") || undefined,
    sectorId: url.searchParams.get("sectorId") || undefined,
    period: url.searchParams.get("period") || undefined,
  });
  return ok({ skills });
}
