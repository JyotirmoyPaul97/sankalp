import { z } from "zod";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";

const JobRoleSchema = z.object({
  title: z.string().min(1).max(160),
  canonicalTitle: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  sectorId: z.string().optional(),
});

export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const sectorId = url.searchParams.get("sectorId") || undefined;
  const where = {
    ...(search ? { OR: [{ title: { contains: search } }, { canonicalTitle: { contains: search } }] } : {}),
    ...(sectorId ? { sectorId } : {}),
  };
  try {
    const [items, total] = await Promise.all([
      db.jobRole.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { title: "asc" },
        include: {
          sector: true,
          roleSkills: { include: { skill: true } },
          _count: { select: { employerRoles: true } },
        },
      }),
      db.jobRole.count({ where }),
    ]);
    return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) { return handlePrismaError(e); }
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = JobRoleSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  try {
    return ok(await db.jobRole.create({ data: parsed.data, include: { sector: true } }));
  } catch (e) { return handlePrismaError(e); }
}
