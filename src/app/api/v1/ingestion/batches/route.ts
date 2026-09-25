import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination } from "@/lib/api";

/**
 * GET /api/v1/ingestion/batches?page=1&pageSize=20
 * List ingestion batches with summary stats.
 */
export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const dataSourceId = url.searchParams.get("dataSourceId") || undefined;

  const where = {
    ...(search ? { OR: [{ batchCode: { contains: search } }, { fileName: { contains: search } }] } : {}),
    ...(status ? { status } : {}),
    ...(dataSourceId ? { dataSourceId } : {}),
  };

  const [items, total] = await Promise.all([
    db.ingestionBatch.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        dataSource: { select: { id: true, name: true, dataStatus: true } },
        uploadedFile: { select: { fileName: true, fileType: true, checksum: true } },
        _count: { select: { records: true, errors: true } },
      },
    }),
    db.ingestionBatch.count({ where }),
  ]);

  return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
