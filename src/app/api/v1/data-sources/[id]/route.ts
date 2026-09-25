import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handlePrismaError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import {
  SOURCE_TYPES,
  DATA_STATUS,
  GEOGRAPHY_LEVEL,
  UPDATE_FREQUENCY,
} from "@/lib/ingestion/vocab";

const DataSourceUpdateSchema = z.object({
  name: z.string().min(1).max(160),
  sourceType: z.enum(SOURCE_TYPES as unknown as [string, ...string[]]),
  description: z.string().max(2000).optional(),
  providerName: z.string().max(120).optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  sourceReference: z.string().max(160).optional(),
  dataStatus: z.enum(DATA_STATUS as unknown as [string, ...string[]]),
  geographyLevel: z.enum(GEOGRAPHY_LEVEL as unknown as [string, ...string[]]).optional(),
  updateFrequency: z.enum(UPDATE_FREQUENCY as unknown as [string, ...string[]]).optional(),
  lastUpdatedAt: z.string().optional(),
  isActive: z.boolean(),
});

/**
 * GET /api/v1/data-sources/[id]
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ds = await db.dataSource.findUnique({
    where: { id },
    include: { _count: { select: { batches: true } } },
  });
  if (!ds) return fail("NOT_FOUND", "Data source not found");
  return ok(ds);
}

/**
 * PUT /api/v1/data-sources/[id]
 * Admin-only.
 */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");

  const { id } = await ctx.params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = DataSourceUpdateSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  const { sourceUrl, lastUpdatedAt, ...rest } = parsed.data;
  const data = {
    ...rest,
    sourceUrl: sourceUrl || null,
    lastUpdatedAt: lastUpdatedAt ? new Date(lastUpdatedAt) : null,
  };
  try {
    const updated = await db.dataSource.update({ where: { id }, data });
    await db.auditLog.create({
      data: {
        userId: admin.sub,
        userEmail: admin.email,
        action: "UPDATED_SOURCE",
        resource: updated.name,
        status: "SUCCESS",
        details: JSON.stringify({ sourceId: id }),
      },
    });
    return ok(updated);
  } catch (e) { return handlePrismaError(e); }
}
