import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const results = await db.scenarioImpactResult.findMany({ where: { scenarioId: id } });
  return ok({ results });
}
