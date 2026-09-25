import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const scenario = await db.policyScenario.findUnique({ where: { id }, include: { district: true, baseline: true, interventions: { include: { interventionType: true } }, assumptions: true, impactResults: true, auditLogs: true } });
  if (!scenario) return fail("NOT_FOUND", "Scenario not found");
  // Normalise `impactResults` → `results` to match the frontend contract.
  const { impactResults, ...rest } = scenario;
  return ok({ ...rest, results: impactResults });
}
