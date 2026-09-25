/**
 * KAUSHAL DRISHTI — Phase 2 Deduplication
 * ---------------------------------------------------------------------
 * Two-stage dedup:
 *  1. EXACT: same (source_id, source_record_id) — must not create duplicates.
 *  2. COMPOUND: same fingerprint (employer+role+district+date for jobs)
 *     — flagged POSSIBLE_DUPLICATE, not silently merged.
 */
import { db } from "@/lib/db";
import { fingerprintJobPosting, type NormalizedJobPosting } from "./validate";

export interface DedupeResult {
  isExactDuplicate: boolean;
  isFingerprintDuplicate: boolean;
  existingRecordId?: string;
  fingerprint: string;
}

/**
 * Check exact + compound duplication against the DB for a job posting.
 * Looks up by (sourceId, sourceRecordId) and by fingerprint.
 */
export async function checkJobPostingDuplicates(
  sourceId: string,
  rec: NormalizedJobPosting,
): Promise<DedupeResult> {
  const fingerprint = fingerprintJobPosting(rec);

  // Exact duplicate check
  if (rec.source_record_id) {
    const exact = await db.ingestionRecord.findFirst({
      where: {
        sourceId,
        sourceRecordId: rec.source_record_id,
      },
      select: { id: true },
    });
    if (exact) {
      return { isExactDuplicate: true, isFingerprintDuplicate: false, existingRecordId: exact.id, fingerprint };
    }
  }

  // Compound duplicate check (same fingerprint within the same source)
  const fp = await db.ingestionRecord.findFirst({
    where: { sourceId, fingerprint },
    select: { id: true },
  });
  if (fp) {
    return { isExactDuplicate: false, isFingerprintDuplicate: true, existingRecordId: fp.id, fingerprint };
  }

  return { isExactDuplicate: false, isFingerprintDuplicate: false, fingerprint };
}
