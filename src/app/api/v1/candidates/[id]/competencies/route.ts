import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const competencies = await db.candidateCompetency.findMany({ where: { candidateId: id }, orderBy: { proficiencyLevel: "desc" } });
  return ok({ competencies });
}
