import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/training/centres */
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const districtId = url.searchParams.get("districtId") || undefined;
  const where = {
    ...(search ? { name: { contains: search } } : {}),
    ...(districtId ? { districtId } : {}),
  };
  const [items, total] = await Promise.all([
    db.trainingCentre.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        district: true,
        institution: true,
        _count: { select: { courseOfferings: true } },
      },
    }),
    db.trainingCentre.count({ where }),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
