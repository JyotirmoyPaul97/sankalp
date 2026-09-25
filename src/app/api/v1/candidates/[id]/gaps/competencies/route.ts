import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const gaps = await db.candidateCompetencyGap.findMany({ where: { candidateId: id }, orderBy: { gapType: "asc" } });
  return ok({ gaps });
}
