import { z } from "zod";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";

const SectorSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(64),
  description: z.string().max(1000).optional(),
});

export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const where = search
    ? { OR: [{ name: { contains: search } }, { code: { contains: search } }] }
    : {};
  try {
    const [items, total] = await Promise.all([
      db.sector.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
        include: { _count: { select: { employers: true, jobRoles: true, courses: true } } },
      }),
      db.sector.count({ where }),
    ]);
    return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = SectorSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  try {
    return ok(await db.sector.create({ data: parsed.data }));
  } catch (e) { return handlePrismaError(e); }
}
