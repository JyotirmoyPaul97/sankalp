import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ districtId: string }> }) {
  const { districtId } = await ctx.params;
  const plans = await db.districtSkillPlan.findMany({ where: { districtId }, include: { baseline: true, scenario: true, _count: { select: { interventions: true, versions: true } } }, orderBy: { createdAt: "desc" } });
  return ok({ plans });
}
