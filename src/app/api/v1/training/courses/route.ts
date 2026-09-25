import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/training/courses */
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
  const [items, total] = await Promise.all([
    db.course.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        sector: true,
        qualification: true,
        provider: true,
        _count: { select: { courseSkills: true, courseRoleMappings: true, courseOfferings: true } },
      },
    }),
    db.course.count({ where }),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
