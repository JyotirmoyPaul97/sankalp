import { z } from "zod";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";

const DataSourceSchema = z.object({
  name: z.string().min(1).max(160),
  sourceType: z.string().min(1).max(80),
  description: z.string().max(2000).optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  dataStatus: z.enum(["REAL", "SYNTHETIC", "MODELLED", "DEMO", "UNKNOWN"]).default("DEMO"),
  lastUpdatedAt: z.string().optional(),
});

export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const where = {
    ...(search ? { OR: [{ name: { contains: search } }, { sourceType: { contains: search } }] } : {}),
    ...(status ? { dataStatus: status } : {}),
  };
  try {
    const [items, total] = await Promise.all([
      db.dataSource.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      db.dataSource.count({ where }),
    ]);
    return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) { return handlePrismaError(e); }
}

export async function POST(req: Request) {
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
    return ok(await db.dataSource.create({ data }));
  } catch (e) { return handlePrismaError(e); }
}
