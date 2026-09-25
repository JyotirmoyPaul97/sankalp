/**
 * KAUSHAL DRISHTI — Phase 2 Ingestion Pipeline
 * ---------------------------------------------------------------------
 * Orchestrates: parse → validate → normalize → dedupe → quality-check
 *              → store (entity + provenance) → audit.
 *
 * Two-phase execution to support the UI stepper:
 *   1. previewAndValidate()  — dry run, returns a preview + issues + draft batch
 *   2. confirmAndStore()     — commits the batch to the DB
 *
 * All DB writes are wrapped in a transaction. Batch inserts used for
 * performance on large datasets.
 */
import { db } from "@/lib/db";
import { validateRecord, type ValidationIssue, type ReferenceLookups } from "./validate";
import { checkJobPostingDuplicates } from "./dedupe";
import { computeQualityScore, deriveBatchStatus, type BatchCounts } from "./quality";
import { entityTypeForSourceType, type QualityStatus } from "./vocab";

// ---------------------------------------------------------------------
// Reference lookups — load once per pipeline run
// ---------------------------------------------------------------------

export async function loadReferenceLookups(): Promise<ReferenceLookups> {
  const [districts, sectors, employers, jobRoles, courses, institutions] = await Promise.all([
    db.district.findMany(),
    db.sector.findMany(),
    db.employer.findMany(),
    db.jobRole.findMany(),
    db.course.findMany(),
    db.institution.findMany(),
  ]);
  const lower = (s: string) => s.toLowerCase().trim();
  return {
    districts: new Set(districts.map((d) => lower(d.name))),
    sectors: new Set(sectors.map((s) => lower(s.name))),
    employers: new Set(employers.map((e) => lower(e.name))),
    jobRoles: new Set(jobRoles.map((r) => lower(r.title))),
    courses: new Set(courses.map((c) => lower(c.name))),
    institutions: new Set(institutions.map((i) => lower(i.name))),
    qualifications: new Set(),
    districtIds: new Map(districts.map((d) => [lower(d.name), d.id])),
    sectorIds: new Map(sectors.map((s) => [lower(s.name), s.id])),
    employerIds: new Map(employers.map((e) => [lower(e.name), e.id])),
    jobRoleIds: new Map(jobRoles.map((r) => [lower(r.title), r.id])),
    courseIds: new Map(courses.map((c) => [lower(c.name), c.id])),
    institutionIds: new Map(institutions.map((i) => [lower(i.name), i.id])),
  };
}

// ---------------------------------------------------------------------
// Per-record pipeline result
// ---------------------------------------------------------------------

export interface RecordResult {
  rowNumber: number;
  accepted: boolean;
  qualityStatus: QualityStatus;
  issues: ValidationIssue[];
  normalized?: Record<string, unknown>;
  fingerprint?: string;
}

export interface PreviewResult {
  batchCode: string;
  recordsReceived: number;
  recordsAccepted: number;
  recordsRejected: number;
  recordsDuplicate: number;
  recordsWarning: number;
  missingRequired: number;
  invalidValues: number;
  unknownReferences: number;
  qualityScore: ReturnType<typeof computeQualityScore>;
  results: RecordResult[];
  sampleErrors: (RecordResult & { preview: string })[];
}

// ---------------------------------------------------------------------
// Phase 1 of 2: preview + validate (no DB writes except creating the
// batch row in UPLOADED status for traceability)
// ---------------------------------------------------------------------

export async function previewAndValidate(params: {
  dataSourceId: string;
  fileType: "csv" | "json" | "synthetic" | "manual";
  records: Record<string, unknown>[];
  fileName?: string;
  uploadedFileId?: string;
  importMode?: string;
  createdBy?: string;
}): Promise<PreviewResult> {
  const ds = await db.dataSource.findUnique({ where: { id: params.dataSourceId } });
  if (!ds) throw new Error("Data source not found");
  const entityType = entityTypeForSourceType(ds.sourceType);
  if (!entityType) throw new Error(`Source type ${ds.sourceType} is not ingestible in Phase 2`);

  const refs = await loadReferenceLookups();
  const batchCode = await nextBatchCode();
  const results: RecordResult[] = [];
  let missingRequired = 0;
  let invalidValues = 0;
  let unknownReferences = 0;

  for (let i = 0; i < params.records.length; i++) {
    const raw = params.records[i];
    const rowNumber = i + 1;
    const result = validateRecord(entityType, raw, refs);
    const issues = result.issues;

    // Tally sub-dimensions
    for (const issue of issues) {
      if (issue.severity === "ERROR") {
        if (issue.problem.startsWith("Missing") || issue.problem.includes("Missing")) missingRequired++;
        else invalidValues++;
      } else if (issue.severity === "WARNING" && issue.problem.startsWith("Unknown")) {
        unknownReferences++;
      }
    }

    if (!result.ok) {
      results.push({ rowNumber, accepted: false, qualityStatus: "REJECTED", issues });
      continue;
    }

    // Dedup check (only for job postings in Phase 2; other entities skip)
    if (entityType === "job_posting" && result.normalized) {
      const dedupe = await checkJobPostingDuplicates(ds.id, result.normalized as never);
      if (dedupe.isExactDuplicate) {
        results.push({
          rowNumber,
          accepted: false,
          qualityStatus: "DUPLICATE",
          issues: [{ field: "source_record_id", problem: "Exact duplicate of an existing record in this source", severity: "ERROR", suggestedAction: "Remove or rename the duplicate source_record_id" }],
          normalized: result.normalized,
          fingerprint: dedupe.fingerprint,
        });
        continue;
      }
      if (dedupe.isFingerprintDuplicate) {
        // Possible duplicate — accepted but flagged
        results.push({
          rowNumber,
          accepted: true,
          qualityStatus: "POSSIBLE_DUPLICATE",
          issues: [...issues, { field: "_fingerprint", problem: "Possible duplicate (matching employer+role+district+date fingerprint)", severity: "WARNING", suggestedAction: "Review whether this is a genuine duplicate" }],
          normalized: result.normalized,
          fingerprint: dedupe.fingerprint,
        });
        continue;
      }
      results.push({
        rowNumber,
        accepted: true,
        qualityStatus: issues.some((x) => x.severity === "WARNING") ? "ACCEPTED" : "ACCEPTED",
        issues,
        normalized: result.normalized,
        fingerprint: dedupe.fingerprint,
      });
    } else {
      results.push({ rowNumber, accepted: true, qualityStatus: "ACCEPTED", issues, normalized: result.normalized });
    }
  }

  const accepted = results.filter((r) => r.accepted && r.qualityStatus !== "DUPLICATE");
  const rejected = results.filter((r) => r.qualityStatus === "REJECTED");
  const duplicate = results.filter((r) => r.qualityStatus === "DUPLICATE");
  const warning = results.filter((r) => r.issues.some((i) => i.severity === "WARNING"));

  const counts: BatchCounts = {
    received: params.records.length,
    accepted: accepted.length,
    rejected: rejected.length,
    duplicate: duplicate.length,
    warning: warning.length,
    missingRequired,
    invalidValues,
    unknownReferences,
  };
  const qualityScore = computeQualityScore(counts);

  // Persist a batch row in UPLOADED status (no records yet)
  const batch = await db.ingestionBatch.create({
    data: {
      batchCode,
      dataSourceId: ds.id,
      uploadedFileId: params.uploadedFileId,
      fileName: params.fileName,
      fileType: params.fileType,
      importMode: params.importMode ?? "UPSERT",
      recordsReceived: counts.received,
      recordsAccepted: counts.accepted,
      recordsRejected: counts.rejected,
      recordsDuplicate: counts.duplicate,
      recordsWarning: counts.warning,
      status: "VALIDATING",
      qualityScore: qualityScore.overall,
      createdBy: params.createdBy,
    },
  });

  // Capture validation errors as IngestionError rows (for the data-quality UI)
  const errorRows = [];
  for (const r of results) {
    for (const issue of r.issues) {
      errorRows.push({
        batchId: batch.id,
        rowNumber: r.rowNumber,
        field: issue.field,
        problem: issue.problem,
        severity: issue.severity,
        suggestedAction: issue.suggestedAction,
        recordPreview: JSON.stringify(params.records[r.rowNumber - 1]).slice(0, 280),
      });
    }
  }
  if (errorRows.length > 0) {
    // Batch insert in chunks of 200
    for (let i = 0; i < errorRows.length; i += 200) {
      await db.ingestionError.createMany({ data: errorRows.slice(i, i + 200) });
    }
  }

  const sampleErrors = results
    .filter((r) => !r.accepted || r.issues.some((i) => i.severity === "WARNING"))
    .slice(0, 50)
    .map((r) => ({ ...r, preview: JSON.stringify(params.records[r.rowNumber - 1]).slice(0, 200) }));

  return {
    batchCode,
    recordsReceived: counts.received,
    recordsAccepted: counts.accepted,
    recordsRejected: counts.rejected,
    recordsDuplicate: counts.duplicate,
    recordsWarning: counts.warning,
    missingRequired,
    invalidValues,
    unknownReferences,
    qualityScore,
    results,
    sampleErrors,
  };
}

// ---------------------------------------------------------------------
// Phase 2 of 2: confirm + store (commit records to entity tables)
// ---------------------------------------------------------------------

export async function confirmAndStore(params: {
  batchCode: string;
  createdBy?: string;
}): Promise<{ batchId: string; status: string; accepted: number }> {
  const batch = await db.ingestionBatch.findUnique({
    where: { batchCode: params.batchCode },
    include: { dataSource: true, errors: true },
  });
  if (!batch) throw new Error("Batch not found");
  if (batch.status === "COMPLETED" || batch.status === "COMPLETED_WITH_WARNINGS") {
    return { batchId: batch.id, status: batch.status, accepted: batch.recordsAccepted };
  }

  const ds = batch.dataSource;
  const entityType = entityTypeForSourceType(ds.sourceType);
  if (!entityType) throw new Error("Non-ingestible entity type");

  // Re-load the source file (or, for synthetic/manual, the caller must re-supply)
  // In this implementation we re-read from the uploaded file via storage.
  // For synthetic seed, confirmAndStoreFromPreview is used instead.
  throw new Error(
    "Use confirmAndStoreFromRecords for the confirm step — re-supplying raw records avoids re-reading the file and supports the in-memory preview.",
  );
}

/** Confirm step: takes the already-validated records + writes them. */
export async function confirmAndStoreFromRecords(params: {
  batchCode: string;
  records: Record<string, unknown>[];
  createdBy?: string;
}): Promise<{ batchId: string; status: string; accepted: number }> {
  const batch = await db.ingestionBatch.findUnique({
    where: { batchCode: params.batchCode },
    include: { dataSource: true },
  });
  if (!batch) throw new Error("Batch not found");

  const ds = batch.dataSource;
  const entityType = entityTypeForSourceType(ds.sourceType);
  if (!entityType) throw new Error("Non-ingestible entity type");

  const refs = await loadReferenceLookups();
  const finalStatus = "PROCESSING";
  await db.ingestionBatch.update({ where: { id: batch.id }, data: { status: finalStatus } });

  let accepted = 0;
  let duplicate = 0;
  let rejected = 0;
  let warning = 0;

  await db.$transaction(async (tx) => {
    for (let i = 0; i < params.records.length; i++) {
      const raw = params.records[i];
      const rowNumber = i + 1;
      const result = validateRecord(entityType, raw, refs);
      if (!result.ok || !result.normalized) {
        rejected++;
        continue;
      }

      // Recheck dedup (within-transaction, against the latest state)
      if (entityType === "job_posting") {
        const dedupe = await checkJobPostingDuplicates(ds.id, result.normalized as never);
        if (dedupe.isExactDuplicate) {
          duplicate++;
          continue;
        }
      }

      // Store the normalized record in the entity table + the raw record in IngestionRecord
      const stored = await storeEntityRecord(tx, entityType, result.normalized, {
        sourceId: ds.id,
        batchId: batch.id,
        dataStatus: ds.dataStatus,
        rawJson: JSON.stringify(raw),
      });
      if (!stored) { rejected++; continue; }
      if (result.issues.some((x) => x.severity === "WARNING")) warning++;

      const fingerprint = entityType === "job_posting"
        // re-derive fingerprint
        ? (await import("./validate")).fingerprintJobPosting(result.normalized as never)
        : null;

      await tx.ingestionRecord.create({
        data: {
          sourceId: ds.id,
          batchId: batch.id,
          sourceRecordId: (result.normalized.source_record_id as string) ?? null,
          sourceTimestamp: result.normalized.posted_at ? new Date(result.normalized.posted_at as string) : null,
          dataStatus: ds.dataStatus,
          entityType,
          normalizedId: stored.id,
          qualityStatus: "ACCEPTED",
          fingerprint,
          rawJson: JSON.stringify(raw),
        },
      });
      accepted++;
    }

    const counts: BatchCounts = {
      received: params.records.length,
      accepted,
      rejected,
      duplicate,
      warning,
      missingRequired: 0,
      invalidValues: 0,
      unknownReferences: 0,
    };
    const status = deriveBatchStatus(counts);
    await tx.ingestionBatch.update({
      where: { id: batch.id },
      data: {
        status,
        recordsAccepted: accepted,
        recordsRejected: rejected,
        recordsDuplicate: duplicate,
        recordsWarning: warning,
        completedAt: new Date(),
      },
    });
  });

  // Audit
  await db.auditLog.create({
    data: {
      userId: params.createdBy ?? null,
      userEmail: null,
      action: "CONFIRMED_IMPORT",
      resource: batch.batchCode,
      status: "SUCCESS",
      details: JSON.stringify({ accepted, duplicate, rejected, batchId: batch.id }),
    },
  });

  const finalBatch = await db.ingestionBatch.findUnique({ where: { id: batch.id } });
  return {
    batchId: batch.id,
    status: finalBatch?.status ?? "COMPLETED",
    accepted,
  };
}

// ---------------------------------------------------------------------
// Entity storage helpers
// ---------------------------------------------------------------------

async function storeEntityRecord(
  tx: Parameters<Parameters<typeof db["$transaction"]>[0]>[0],
  entityType: string,
  rec: Record<string, unknown>,
  meta: { sourceId: string; batchId: string; dataStatus: string; rawJson: string },
): Promise<{ id: string } | null> {
  switch (entityType) {
    case "job_posting": {
      const districtId = (await lookupDistrictId(rec.district as string, tx));
      const sectorId = rec.sector ? await lookupSectorId(rec.sector as string, tx) : null;
      const employerId = rec.employer ? await lookupEmployerId(rec.employer as string, tx) : null;
      const jobRoleId = rec.role ? await lookupJobRoleId(rec.role as string, tx) : null;
      const created = await tx.jobPosting.create({
        data: {
          sourceId: meta.sourceId,
          batchId: meta.batchId,
          sourceRecordId: (rec.source_record_id as string) ?? null,
          employerName: (rec.employer as string) ?? "",
          employerId: employerId ?? null,
          roleTitle: (rec.role as string) ?? "",
          jobRoleId: jobRoleId ?? null,
          districtId: districtId ?? null,
          districtName: (rec.district as string) ?? null,
          sectorId: sectorId ?? null,
          postedAt: rec.posted_at ? new Date(rec.posted_at as string) : null,
          dataStatus: meta.dataStatus,
          rawJson: meta.rawJson,
        },
      });
      return { id: created.id };
    }
    case "employer_survey": {
      const created = await tx.employerSurvey.create({
        data: {
          sourceId: meta.sourceId,
          batchId: meta.batchId,
          sourceRecordId: (rec.source_record_id as string) ?? null,
          employerName: (rec.employer as string) ?? "",
          roleTitle: (rec.role as string) ?? null,
          responseDate: rec.response_date ? new Date(rec.response_date as string) : null,
          satisfactionScore: (rec.satisfaction_score as number) ?? null,
          dataStatus: meta.dataStatus,
          rawJson: meta.rawJson,
        },
      });
      return { id: created.id };
    }
    case "industry_consultation": {
      const sectorId = rec.sector ? await lookupSectorId(rec.sector as string, tx) : null;
      const created = await tx.industryConsultation.create({
        data: {
          sourceId: meta.sourceId,
          batchId: meta.batchId,
          sourceRecordId: (rec.source_record_id as string) ?? null,
          sectorId: sectorId ?? null,
          sectorName: (rec.sector as string) ?? null,
          organization: (rec.organization as string) ?? "",
          consultationDate: rec.consultation_date ? new Date(rec.consultation_date as string) : null,
          keyFindings: (rec.key_findings as string) ?? null,
          dataStatus: meta.dataStatus,
          rawJson: meta.rawJson,
        },
      });
      return { id: created.id };
    }
    case "sector_growth": {
      const sectorId = rec.sector ? await lookupSectorId(rec.sector as string, tx) : null;
      const created = await tx.sectorGrowth.create({
        data: {
          sourceId: meta.sourceId,
          batchId: meta.batchId,
          sourceRecordId: (rec.source_record_id as string) ?? null,
          sectorId: sectorId ?? null,
          sectorName: (rec.sector as string) ?? "",
          geography: (rec.geography as string) ?? "",
          period: (rec.period as string) ?? "",
          growthRatePct: (rec.growth_rate_pct as number) ?? null,
          dataStatus: meta.dataStatus,
          rawJson: meta.rawJson,
        },
      });
      return { id: created.id };
    }
    case "placement_outcome": {
      const courseId = rec.course ? await lookupCourseId(rec.course as string, tx) : null;
      const institutionId = rec.institution ? await lookupInstitutionId(rec.institution as string, tx) : null;
      const created = await tx.placementOutcome.create({
        data: {
          sourceId: meta.sourceId,
          batchId: meta.batchId,
          sourceRecordId: (rec.source_record_id as string) ?? null,
          courseId: courseId ?? null,
          courseName: (rec.course as string) ?? null,
          institutionId: institutionId ?? null,
          institutionName: (rec.institution as string) ?? null,
          period: (rec.period as string) ?? "",
          totalCandidates: (rec.total_candidates as number) ?? 0,
          placedCount: (rec.placed_count as number) ?? 0,
          placementRate: (rec.placement_rate as number) ?? null,
          dataStatus: meta.dataStatus,
          rawJson: meta.rawJson,
        },
      });
      return { id: created.id };
    }
    case "technology_trend": {
      const sectorId = rec.sector ? await lookupSectorId(rec.sector as string, tx) : null;
      const created = await tx.technologyTrend.create({
        data: {
          sourceId: meta.sourceId,
          batchId: meta.batchId,
          sourceRecordId: (rec.source_record_id as string) ?? null,
          technology: (rec.technology as string) ?? "",
          sectorId: sectorId ?? null,
          sectorName: (rec.sector as string) ?? null,
          trendDirection: (rec.trend_direction as string) ?? "STABLE",
          impactLevel: (rec.impact_level as number) ?? null,
          timeHorizon: (rec.time_horizon as string) ?? null,
          notes: (rec.notes as string) ?? null,
          dataStatus: meta.dataStatus,
          rawJson: meta.rawJson,
        },
      });
      return { id: created.id };
    }
    default:
      return null;
  }
}

async function lookupDistrictId(name: string | undefined, tx: any): Promise<string | null> {
  if (!name) return null;
  const d = await tx.district.findFirst({ where: { name: { equals: name } } });
  return d?.id ?? null;
}
async function lookupSectorId(name: string | undefined, tx: any): Promise<string | null> {
  if (!name) return null;
  const s = await tx.sector.findFirst({ where: { name: { equals: name } } });
  return s?.id ?? null;
}
async function lookupEmployerId(name: string | undefined, tx: any): Promise<string | null> {
  if (!name) return null;
  const e = await tx.employer.findFirst({ where: { name: { equals: name } } });
  return e?.id ?? null;
}
async function lookupJobRoleId(title: string | undefined, tx: any): Promise<string | null> {
  if (!title) return null;
  const r = await tx.jobRole.findFirst({ where: { title: { equals: title } } });
  return r?.id ?? null;
}
async function lookupCourseId(name: string | undefined, tx: any): Promise<string | null> {
  if (!name) return null;
  const c = await tx.course.findFirst({ where: { name: { equals: name } } });
  return c?.id ?? null;
}
async function lookupInstitutionId(name: string | undefined, tx: any): Promise<string | null> {
  if (!name) return null;
  const i = await tx.institution.findFirst({ where: { name: { equals: name } } });
  return i?.id ?? null;
}

// ---------------------------------------------------------------------
// Batch code generator: ING-YYYY-NNNN
// ---------------------------------------------------------------------

async function nextBatchCode(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const count = await db.ingestionBatch.count({
    where: { batchCode: { startsWith: `ING-${year}-` } },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `ING-${year}-${seq}`;
}
