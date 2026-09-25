import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(req: Request) {
  const { page, pageSize, skip } = parsePagination(req);
  const [items, total] = await Promise.all([
    db.districtSkillPlan.findMany({ skip, take: pageSize, orderBy: { createdAt: "desc" }, include: { district: true, baseline: true, scenario: true, _count: { select: { interventions: true } } } }),
    db.districtSkillPlan.count(),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
