import { ok, fail } from "@/lib/api";
import { getGapExplanation } from "@/lib/intelligence/gap";

/** GET /api/v1/gaps/[id]/explanation — why is this classified as a gap? */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const explanation = await getGapExplanation(id);
  if (!explanation) return fail("NOT_FOUND", "Gap signal not found");
  return ok(explanation);
}
