import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { storeUpload, StorageError, validateFileType, sanitizeFileName } from "@/lib/storage";
import { parseUpload } from "@/lib/ingestion/parser";
import { previewAndValidate } from "@/lib/ingestion/pipeline";
import { entityTypeForSourceType } from "@/lib/ingestion/vocab";

export const runtime = "nodejs";

/**
 * POST /api/v1/ingestion/upload
 * Multipart form: file (csv|json), dataSourceId, importMode?
 * Admin-only. Stores the file, parses, validates, returns a preview +
 * draft batchCode. The client then calls /confirm to commit.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("BAD_REQUEST", "Expected multipart/form-data");
  }

  const file = form.get("file");
  const dataSourceId = form.get("dataSourceId");
  const importMode = (form.get("importMode") as string) || "UPSERT";

  if (typeof dataSourceId !== "string" || !dataSourceId) {
    return fail("VALIDATION_ERROR", "dataSourceId is required");
  }
  if (!(file instanceof File)) {
    return fail("VALIDATION_ERROR", "file (csv or json) is required");
  }

  // Validate file type BEFORE reading content
  try {
    validateFileType(file.name);
  } catch (e) {
    if (e instanceof StorageError) return fail("FILE_TYPE_NOT_ALLOWED" as never, e.message);
    throw e;
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Store the file
  let stored;
  try {
    stored = await storeUpload(file.name, buf);
  } catch (e) {
    if (e instanceof StorageError) {
      return fail("BAD_REQUEST", e.message);
    }
    throw e;
  }

  // Check for duplicate upload (same checksum)
  const existing = await db.uploadedFile.findUnique({ where: { checksum: stored.checksum } });
  const isDuplicateUpload = !!existing;

  // Persist UploadedFile row
  const uploadedFile = await db.uploadedFile.create({
    data: {
      fileName: stored.fileName,
      fileType: stored.fileType,
      storageKey: stored.storageKey,
      sizeBytes: stored.sizeBytes,
      checksum: stored.checksum,
      uploadedBy: admin.sub,
    },
  });

  // Audit
  await db.auditLog.create({
    data: {
      userId: admin.sub,
      userEmail: admin.email,
      action: "UPLOADED_DATASET",
      resource: stored.fileName,
      status: "SUCCESS",
      details: JSON.stringify({ dataSourceId, fileType: stored.fileType, size: stored.sizeBytes, checksum: stored.checksum }),
    },
  });

  // Parse
  const text = buf.toString("utf8");
  let parsed;
  try {
    parsed = parseUpload(text, stored.fileType as "csv" | "json");
  } catch (e) {
    await db.ingestionBatch.create({
      data: {
        batchCode: `ING-${new Date().getUTCFullYear()}-${Date.now().toString().slice(-6)}`,
        dataSourceId,
        uploadedFileId: uploadedFile.id,
        fileName: stored.fileName,
        fileType: stored.fileType,
        status: "FAILED",
        errorSummary: e instanceof Error ? e.message : "Parse failed",
        createdBy: admin.sub,
      },
    });
    return fail("VALIDATION_ERROR", `Could not parse ${stored.fileType.toUpperCase()} file: ${e instanceof Error ? e.message : "unknown error"}`);
  }

  // Validate the source type is ingestible
  const ds = await db.dataSource.findUnique({ where: { id: dataSourceId } });
  if (!ds) return fail("NOT_FOUND", "Data source not found");
  const entityType = entityTypeForSourceType(ds.sourceType);
  if (!entityType) {
    return fail("VALIDATION_ERROR", `Source type ${ds.sourceType} is not ingestible in Phase 2`);
  }

  // Run preview + validation pipeline
  try {
    const preview = await previewAndValidate({
      dataSourceId,
      fileType: stored.fileType as "csv" | "json",
      records: parsed.records,
      fileName: stored.fileName,
      uploadedFileId: uploadedFile.id,
      importMode,
      createdBy: admin.sub,
    });

    return ok({
      batchCode: preview.batchCode,
      batchId: (await db.ingestionBatch.findUnique({ where: { batchCode: preview.batchCode } }))?.id,
      fileName: stored.fileName,
      fileType: stored.fileType,
      fileSize: stored.sizeBytes,
      checksum: stored.checksum,
      isDuplicateUpload,
      entityType,
      dataSource: { id: ds.id, name: ds.name, dataStatus: ds.dataStatus },
      summary: {
        recordsReceived: preview.recordsReceived,
        recordsAccepted: preview.recordsAccepted,
        recordsRejected: preview.recordsRejected,
        recordsDuplicate: preview.recordsDuplicate,
        recordsWarning: preview.recordsWarning,
        qualityScore: preview.qualityScore,
      },
      sampleErrors: preview.sampleErrors.slice(0, 25),
    });
  } catch (e) {
    return fail("INTERNAL_ERROR", e instanceof Error ? e.message : "Pipeline failed");
  }
}

// Helper exposed for callers that need to sanitize a filename client-side.
export { sanitizeFileName };
