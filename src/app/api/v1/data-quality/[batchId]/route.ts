import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { computeQualityScore, type BatchCounts } from "@/lib/ingestion/quality";

/**
 * GET /api/v1/data-quality/[batchId]
 * Aggregated quality report for a batch: per-dimension scores + error breakdown.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await ctx.params;
  const batch = await db.ingestionBatch.findUnique({
    where: { id: batchId },
    include: { _count: { select: { records: true, errors: true } } },
  });
  if (!batch) return fail("NOT_FOUND", "Batch not found");

  // Aggregate errors by severity + field
  const allErrors = await db.ingestionError.findMany({
    where: { batchId },
    select: { severity: true, field: true, problem: true },
  });

  let missingRequired = 0;
  let invalidValues = 0;
  let unknownReferences = 0;
  for (const e of allErrors) {
    if (e.severity === "ERROR") {
      if (e.problem.startsWith("Missing") || e.problem.includes("Missing")) missingRequired++;
      else invalidValues++;
    } else if (e.severity === "WARNING" && e.problem.startsWith("Unknown")) {
      unknownReferences++;
    }
  }

  const counts: BatchCounts = {
    received: batch.recordsReceived,
    accepted: batch.recordsAccepted,
    rejected: batch.recordsRejected,
    duplicate: batch.recordsDuplicate,
    warning: batch.recordsWarning,
    missingRequired,
    invalidValues,
    unknownReferences,
  };
  const qualityScore = computeQualityScore(counts);

  // Top problem fields
  const fieldCounts = new Map<string, { count: number; severity: string }>();
  for (const e of allErrors) {
    const key = e.field || "_unknown";
    const existing = fieldCounts.get(key);
    if (existing) existing.count++;
    else fieldCounts.set(key, { count: 1, severity: e.severity });
  }
  const topFields = [...fieldCounts.entries()]
    .map(([field, v]) => ({ field, count: v.count, severity: v.severity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return ok({
    batchId: batch.id,
    batchCode: batch.batchCode,
    status: batch.status,
    counts: {
      received: batch.recordsReceived,
      accepted: batch.recordsAccepted,
      rejected: batch.recordsRejected,
      duplicate: batch.recordsDuplicate,
      warning: batch.recordsWarning,
    },
    qualityScore,
    storedQualityScore: batch.qualityScore,
    topFields,
    totalErrors: allErrors.length,
    errorsBySeverity: {
      ERROR: allErrors.filter((e) => e.severity === "ERROR").length,
      WARNING: allErrors.filter((e) => e.severity === "WARNING").length,
      INFO: allErrors.filter((e) => e.severity === "INFO").length,
    },
  });
}
