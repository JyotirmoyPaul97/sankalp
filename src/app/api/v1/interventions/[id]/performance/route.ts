import { ok, fail } from "@/lib/api";
import { evaluateIntervention } from "@/lib/intelligence/twin";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await evaluateIntervention(id);
  if (!result) return fail("NOT_FOUND", "Intervention not found");
  return ok(result);
}
