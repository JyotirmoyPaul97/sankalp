import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const paths = await db.candidateDevelopmentPath.findMany({ where: { candidateId: id }, include: { jobRole: true, steps: { include: { skill: true, course: true }, orderBy: { sequence: "asc" } } } });
  return ok({ paths });
}
