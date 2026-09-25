import { z } from "zod";
import { ok, fail, handlePrismaError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createBaseline } from "@/lib/intelligence/twin";
const Schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  districtId: z.string().min(1),
  interventions: z.array(z.object({
    interventionTypeId: z.string(),
    targetCourseId: z.string().optional(),
    targetSkillId: z.string().optional(),
    targetRoleId: z.string().optional(),
    capacityChange: z.number().int().optional(),
    quantity: z.number().int().optional(),
  })).default([]),
  assumptions: z.array(z.object({
    name: z.string(), value: z.string(), unit: z.string().optional(), description: z.string().optional(),
  })).default([]),
});
export async function GET() {
  const scenarios = await db.policyScenario.findMany({ include: { district: true, interventions: { include: { interventionType: true } }, _count: { select: { results: true, assumptions: true } } }, orderBy: { createdAt: "desc" } });
  return ok({ scenarios });
}
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  const { name, description, districtId, interventions, assumptions } = parsed.data;
  const { baselineId } = await createBaseline(districtId, "2026-09");
  const scenario = await db.policyScenario.create({ data: { name, description, districtId, baselineId, createdBy: admin.sub, status: "DRAFT" } });
  for (const iv of interventions) {
    await db.scenarioIntervention.create({ data: { scenarioId: scenario.id, interventionTypeId: iv.interventionTypeId, targetCourseId: iv.targetCourseId, targetSkillId: iv.targetSkillId, targetRoleId: iv.targetRoleId, capacityChange: iv.capacityChange, quantity: iv.quantity, assumptions: JSON.stringify(iv) } });
  }
  for (const a of assumptions) {
    await db.scenarioAssumption.create({ data: { scenarioId: scenario.id, name: a.name, value: a.value, unit: a.unit, description: a.description } });
  }
  await db.scenarioAuditLog.create({ data: { scenarioId: scenario.id, userId: admin.sub, userEmail: admin.email, action: "CREATED", details: `Created with ${interventions.length} interventions, ${assumptions.length} assumptions` } });
  return ok(scenario);
}
