import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/training/qualifications */
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const where = search ? { OR: [{ name: { contains: search } }, { code: { contains: search } }] } : {};
  const [items, total] = await Promise.all([
    db.qualification.findMany({
      where, skip, take: pageSize, orderBy: { name: "asc" },
      include: { _count: { select: { courses: true, trainingCertifications: true } } },
    }),
    db.qualification.count({ where }),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
