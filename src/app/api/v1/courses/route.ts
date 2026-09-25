import { z } from "zod";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";

const CourseSchema = z.object({
  name: z.string().min(1).max(160),
  code: z.string().min(1).max(64),
  description: z.string().max(2000).optional(),
  sectorId: z.string().optional(),
  qualificationId: z.string().optional(),
  durationHours: z.number().int().min(1).max(10000),
  status: z.enum(["DRAFT", "ACTIVE", "UNDER_REVIEW", "DEPRECATED"]).default("ACTIVE"),
});

export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const sectorId = url.searchParams.get("sectorId") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const where = {
    ...(search ? { OR: [{ name: { contains: search } }, { code: { contains: search } }] } : {}),
    ...(sectorId ? { sectorId } : {}),
    ...(status ? { status } : {}),
  };
  try {
    const [items, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
        include: {
          sector: true,
          qualification: true,
          courseInstitutions: { include: { institution: true } },
          courseSkills: { include: { skill: true } },
          _count: { select: { courseInstitutions: true, courseSkills: true } },
        },
      }),
      db.course.count({ where }),
    ]);
    return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) { return handlePrismaError(e); }
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = CourseSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  try {
    return ok(
      await db.course.create({
        data: parsed.data,
        include: { sector: true, qualification: true },
      }),
    );
  } catch (e) { return handlePrismaError(e); }
}
