import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handlePrismaError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ALIAS_TYPES } from "@/lib/intelligence/vocab";

/** GET /api/v1/skills/[id]/aliases */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const aliases = await db.skillAlias.findMany({ where: { skillId: id }, orderBy: { alias: "asc" } });
  return ok({ aliases });
}

const AliasSchema = z.object({
  alias: z.string().min(1).max(160),
  aliasType: z.enum(ALIAS_TYPES as unknown as [string, ...string[]]).default("VARIANT"),
  isCaseSensitive: z.boolean().default(false),
});

/** POST /api/v1/skills/[id]/aliases — admin-only */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const { id } = await ctx.params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = AliasSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  try {
    const created = await db.skillAlias.create({ data: { skillId: id, ...parsed.data } });
    return ok(created);
  } catch (e) { return handlePrismaError(e); }
}
