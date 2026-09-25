import { db } from "@/lib/db";
import { paginated, parsePagination } from "@/lib/api";

/**
 * GET /api/v1/audit-logs?page=1&pageSize=20&action=CONFIRMED_IMPORT
 * Ingestion + admin audit trail. No secrets are logged.
 */
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || undefined;

  const where = {
    ...(action ? { action } : {}),
    ...(search ? { OR: [{ resource: { contains: search } }, { userEmail: { contains: search } }] } : {}),
  };

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { timestamp: "desc" },
    }),
    db.auditLog.count({ where }),
  ]);

  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
