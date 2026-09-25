import { ok, fail } from "@/lib/api";
import { buildDistrictTwin } from "@/lib/intelligence/twin";
export async function GET(_req: Request, ctx: { params: Promise<{ districtId: string }> }) {
  const { districtId } = await ctx.params;
  const { twin } = await buildDistrictTwin(districtId);
  if (!twin || Object.keys(twin).length === 0) return fail("NOT_FOUND", "District not found");
  return ok(twin);
}
