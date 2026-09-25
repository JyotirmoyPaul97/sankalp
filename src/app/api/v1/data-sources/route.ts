import { z } from "zod";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import {
  SOURCE_TYPES,
  DATA_STATUS,
  GEOGRAPHY_LEVEL,
  UPDATE_FREQUENCY,
} from "@/lib/ingestion/vocab";

const DataSourceSchema = z.object({
  name: z.string().min(1).max(160),
  sourceType: z.enum(SOURCE_TYPES as unknown as [string, ...string[]]),
  description: z.string().max(2000).optional(),
  providerName: z.string().max(120).optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  sourceReference: z.string().max(160).optional(),
  dataStatus: z.enum(DATA_STATUS as unknown as [string, ...string[]]).default("DEMO"),
  geographyLevel: z.enum(GEOGRAPHY_LEVEL as unknown as [string, ...string[]]).optional(),
  updateFrequency: z.enum(UPDATE_FREQUENCY as unknown as [string, ...string[]]).optional(),
  lastUpdatedAt: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const sourceType = url.searchParams.get("sourceType") || undefined;
  const active = url.searchParams.get("active");

  const where = {
    ...(search ? { OR: [{ name: { contains: search } }, { sourceType: { contains: search } }, { providerName: { contains: search } }] } : {}),
    ...(status ? { dataStatus: status } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(active !== null && active !== undefined && active !== "" ? { isActive: active === "true" } : {}),
  };
  try {
    const [items, total] = await Promise.all([
      db.dataSource.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
        include: { _count: { select: { batches: true } } },
      }),
      db.dataSource.count({ where }),
    ]);
    return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) { return handlePrismaError(e); }
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");

  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = DataSourceSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  const { sourceUrl, lastUpdatedAt, ...rest } = parsed.data;
  const data = {
    ...rest,
    sourceUrl: sourceUrl || null,
    lastUpdatedAt: lastUpdatedAt ? new Date(lastUpdatedAt) : null,
  };
  try {
    const created = await db.dataSource.create({ data });
    await db.auditLog.create({
      data: {
        userId: admin.sub,
        userEmail: admin.email,
        action: "CREATED_SOURCE",
        resource: created.name,
        status: "SUCCESS",
        details: JSON.stringify({ sourceId: created.id, sourceType: created.sourceType }),
      },
    });
    return ok(created);
  } catch (e) { return handlePrismaError(e); }
}
