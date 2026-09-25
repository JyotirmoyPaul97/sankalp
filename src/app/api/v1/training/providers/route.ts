import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/training/providers */
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const where = search ? { OR: [{ name: { contains: search } }, { providerType: { contains: search } }] } : {};
  const [items, total] = await Promise.all([
    db.trainingProvider.findMany({ where, skip, take: pageSize, orderBy: { name: "asc" }, include: { _count: { select: { institutions: true, courses: true } } } }),
    db.trainingProvider.count({ where }),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
