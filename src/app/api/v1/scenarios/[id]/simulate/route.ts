import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { simulateScenario } from "@/lib/intelligence/twin";
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const { id } = await ctx.params;
  try {
    const result = await simulateScenario(id);
    return ok(result);
  } catch (e) {
    return fail("INTERNAL_ERROR", e instanceof Error ? e.message : "Simulation failed");
  }
}
