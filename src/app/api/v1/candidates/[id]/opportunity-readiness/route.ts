import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const readiness = await db.candidateOpportunityReadiness.findMany({ where: { candidateId: id }, include: { jobRole: true } });
  return ok({ readiness });
}
