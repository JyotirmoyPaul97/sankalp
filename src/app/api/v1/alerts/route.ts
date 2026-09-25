import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(req: Request) {
  const { page, pageSize, skip } = parsePagination(req);
  const [items, total] = await Promise.all([
    db.districtAlert.findMany({ skip, take: pageSize, orderBy: { timestamp: "desc" }, include: { } }),
    db.districtAlert.count(),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
