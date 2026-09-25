import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const scenario = await db.policyScenario.findUnique({ where: { id }, include: { district: true, baseline: true, interventions: { include: { interventionType: true } }, assumptions: true, results: true, auditLogs: true } });
  if (!scenario) return fail("NOT_FOUND", "Scenario not found");
  return ok(scenario);
}
