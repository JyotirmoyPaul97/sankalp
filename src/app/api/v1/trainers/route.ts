import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const centreId = url.searchParams.get("centreId") || undefined;
  const where = { ...(search ? { name: { contains: search } } : {}), ...(centreId ? { trainingCentreId: centreId } : {}) };
  const [items, total] = await Promise.all([
    db.trainer.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" }, include: { trainingCentre: { include: { district: true, institution: true } }, _count: { select: { skillMappings: true, competencyMappings: true } } } }),
    db.trainer.count({ where }),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
