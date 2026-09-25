import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { readStoredFile } from "@/lib/storage";
import { parseUpload } from "@/lib/ingestion/parser";
import { confirmAndStoreFromRecords } from "@/lib/ingestion/pipeline";

const ConfirmSchema = z.object({
  batchCode: z.string().min(1).max(64),
  // If records are supplied inline (e.g. from a manual entry preview),
  // use them; otherwise re-read from the stored file.
  records: z.array(z.record(z.unknown())).optional(),
});

/**
 * POST /api/v1/ingestion/confirm
 * Admin-only. Commits a previously-uploaded batch to entity tables.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body");
  }
  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  }

  const batch = await db.ingestionBatch.findUnique({
    where: { batchCode: parsed.data.batchCode },
    include: { dataSource: true, uploadedFile: true },
  });
  if (!batch) return fail("NOT_FOUND", "Batch not found");
  if (batch.status === "COMPLETED" || batch.status === "COMPLETED_WITH_WARNINGS") {
    return fail("BAD_REQUEST", `Batch already ${batch.status}`);
  }

  // Resolve records: prefer inline, else re-read the uploaded file
  let records: Record<string, unknown>[] | undefined = parsed.data.records;
  if (!records && batch.uploadedFile) {
    try {
      const text = await readStoredFile(batch.uploadedFile.storageKey);
      records = parseUpload(text, batch.uploadedFile.fileType as "csv" | "json").records;
    } catch (e) {
      return fail("INTERNAL_ERROR", `Could not re-read source file: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }
  if (!records) return fail("BAD_REQUEST", "No records supplied and no source file to re-read");

  try {
    const result = await confirmAndStoreFromRecords({
      batchCode: parsed.data.batchCode,
      records,
      createdBy: admin.sub,
    });

    await db.auditLog.create({
      data: {
        userId: admin.sub,
        userEmail: admin.email,
        action: "CONFIRMED_IMPORT",
        resource: parsed.data.batchCode,
        status: "SUCCESS",
        details: JSON.stringify({ accepted: result.accepted, batchId: result.batchId }),
      },
    });

    return ok(result);
  } catch (e) {
    return fail("INTERNAL_ERROR", e instanceof Error ? e.message : "Confirm failed");
  }
}
