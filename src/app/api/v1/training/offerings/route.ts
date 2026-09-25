import { ok, paginated, parsePagination } from "@/lib/api";
import { db } from "@/lib/db";

/** GET /api/v1/training/offerings */
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId") || undefined;
  const centreId = url.searchParams.get("centreId") || undefined;
  const period = url.searchParams.get("period") || undefined;
  const where = {
    ...(courseId ? { courseId } : {}),
    ...(centreId ? { trainingCentreId: centreId } : {}),
    ...(period ? { periodLabel: period } : {}),
  };
  const [items, total] = await Promise.all([
    db.courseOffering.findMany({
      where, skip, take: pageSize, orderBy: { periodLabel: "desc" },
      include: {
        course: { include: { sector: true } },
        trainingCentre: { include: { district: true, institution: true } },
        _count: { select: { certifications: true } },
      },
    }),
    db.courseOffering.count({ where }),
  ]);
  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
