import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const plan = await db.districtSkillPlan.findUnique({ where: { id }, include: { district: true, baseline: true, scenario: { include: { results: true, interventions: { include: { interventionType: true } }, assumptions: true } }, interventions: { include: { interventionType: true, milestones: true, kpis: { include: { observations: true } }, outcomes: true } }, versions: true } });
  if (!plan) return fail("NOT_FOUND", "District plan not found");
  return ok(plan);
}
