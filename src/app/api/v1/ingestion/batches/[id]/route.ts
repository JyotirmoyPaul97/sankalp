import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

/**
 * GET /api/v1/ingestion/batches/[id]
 * Batch detail: summary, errors, provenance, record counts.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const batch = await db.ingestionBatch.findUnique({
    where: { id },
    include: {
      dataSource: true,
      uploadedFile: true,
      _count: { select: { records: true, errors: true } },
    },
  });
  if (!batch) return fail("NOT_FOUND", "Batch not found");

  // Errors split by severity (cap to 200 for the UI)
  const errors = await db.ingestionError.findMany({
    where: { batchId: id },
    orderBy: { rowNumber: "asc" },
    take: 200,
  });

  // A few sample provenance records (raw → normalized)
  const sampleRecords = await db.ingestionRecord.findMany({
    where: { batchId: id },
    take: 10,
    orderBy: { ingestedAt: "desc" },
    select: {
      id: true,
      sourceRecordId: true,
      entityType: true,
      normalizedId: true,
      qualityStatus: true,
      dataStatus: true,
      ingestedAt: true,
      rawJson: true,
    },
  });

  return ok({
    batch,
    errors,
    errorCount: batch._count.errors,
    recordCount: batch._count.records,
    sampleRecords,
  });
}
