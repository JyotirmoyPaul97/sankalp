import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ districtId: string }> }) {
  const { districtId } = await ctx.params;
  const interventions = await db.districtIntervention.findMany({ where: { districtId }, include: { interventionType: true, kpis: { include: { observations: true } }, outcomes: true, milestones: true } });
  const alerts = await db.districtAlert.findMany({ where: { districtId }, orderBy: { timestamp: "desc" }, take: 20 });
  return ok({ interventions, alerts });
}
