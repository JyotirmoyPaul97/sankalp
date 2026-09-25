import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const where = search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {};
  const [items, total] = await Promise.all([
    db.candidate.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" }, include: { district: true, _count: { select: { skills: true, targetProfiles: true, skillGaps: true } } } }),
    db.candidate.count({ where }),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
