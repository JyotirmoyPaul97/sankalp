import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const evidence = await db.candidateEvidence.findMany({ where: { candidateId: id }, include: { skill: true }, orderBy: { evidenceTimestamp: "desc" } });
  return ok({ evidence });
}
