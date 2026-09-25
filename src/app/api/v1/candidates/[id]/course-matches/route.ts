import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const matches = await db.candidateCourseMatch.findMany({ where: { candidateId: id }, include: { course: { include: { sector: true } } }, orderBy: { matchConfidence: "desc" } });
  return ok({ matches });
}
