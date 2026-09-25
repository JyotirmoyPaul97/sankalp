import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const skills = await db.candidateSkill.findMany({ where: { candidateId: id }, include: { skill: true }, orderBy: { currentProficiency: "desc" } });
  return ok({ skills });
}
