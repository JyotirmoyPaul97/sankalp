import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/training/institutions */
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const districtId = url.searchParams.get("districtId") || undefined;
  const where = {
    ...(search ? { name: { contains: search } } : {}),
    ...(districtId ? { districtId } : {}),
  };
  const [items, total] = await Promise.all([
    db.institution.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        district: true,
        provider: true,
        _count: { select: { trainingCentres: true, courseInstitutions: true, courses: true } },
      },
    }),
    db.institution.count({ where }),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
