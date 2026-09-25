import { z } from "zod";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";

const SkillSchema = z.object({
  name: z.string().min(1).max(160),
  canonicalName: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  category: z.string().max(80).optional(),
});

export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const where = {
    ...(search
      ? { OR: [{ name: { contains: search } }, { canonicalName: { contains: search } }] }
      : {}),
    ...(category ? { category } : {}),
  };
  try {
    const [items, total] = await Promise.all([
      db.skill.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
        include: { _count: { select: { roleSkills: true, courseSkills: true } } },
      }),
      db.skill.count({ where }),
    ]);
    return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) { return handlePrismaError(e); }
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = SkillSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  try {
    return ok(await db.skill.create({ data: parsed.data }));
  } catch (e) { return handlePrismaError(e); }
}
