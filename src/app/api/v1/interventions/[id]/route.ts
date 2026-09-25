import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const iv = await db.districtIntervention.findUnique({ where: { id }, include: { interventionType: true, district: true, milestones: true, kpis: { include: { observations: true } }, outcomes: true } });
  if (!iv) return fail("NOT_FOUND", "Intervention not found");
  return ok(iv);
}
