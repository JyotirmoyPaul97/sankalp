import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handlePrismaError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { RELATION_TYPES } from "@/lib/intelligence/vocab";

const RelationSchema = z.object({
  toSkillId: z.string().min(1),
  relationType: z.enum(RELATION_TYPES as unknown as [string, ...string[]]).default("RELATED_TO"),
  weight: z.number().int().min(1).max(10).default(1),
});

/** GET /api/v1/skills/[id]/relations — outgoing + incoming edges */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [outgoing, incoming] = await Promise.all([
    db.skillRelation.findMany({ where: { fromSkillId: id }, include: { toSkill: true } }),
    db.skillRelation.findMany({ where: { toSkillId: id }, include: { fromSkill: true } }),
  ]);
  return ok({ outgoing, incoming });
}

/** POST /api/v1/skills/[id]/relations — admin-only */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const { id } = await ctx.params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = RelationSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  if (parsed.data.toSkillId === id) return fail("BAD_REQUEST", "Cannot relate a skill to itself");
  try {
    const created = await db.skillRelation.create({
      data: { fromSkillId: id, toSkillId: parsed.data.toSkillId, relationType: parsed.data.relationType, weight: parsed.data.weight },
    });
    return ok(created);
  } catch (e) { return handlePrismaError(e); }
}
