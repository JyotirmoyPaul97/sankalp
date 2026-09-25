import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profiles = await db.candidateTargetProfile.findMany({ where: { candidateId: id }, include: { jobRole: { include: { sector: true } }, sector: true, district: true, cluster: true } });
  return ok({ targetRoles: profiles });
}
