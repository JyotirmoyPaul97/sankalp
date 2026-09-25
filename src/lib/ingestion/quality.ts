/**
 * KAUSHAL DRISHTI — Phase 2 Data Quality Framework
 * ---------------------------------------------------------------------
 * Deterministic quality scoring. NO ML.
 *
 * Quality Score = weighted sum of:
 *   - completeness  (are required fields present?)
 *   - validity       (do values match expected formats?)
 *   - uniqueness     (1 - duplicate_rate)
 *   - consistency    (referential-integrity pass rate)
 *
 * Each dimension is 0-100; the weighted sum is also 0-100.
 */
export interface BatchCounts {
  received: number;
  accepted: number;
  rejected: number;
  duplicate: number;
  warning: number;
  // sub-dimensions
  missingRequired: number;
  invalidValues: number;
  unknownReferences: number;
}

export interface QualityScore {
  total: number;
  completeness: number;   // 0-100
  validity: number;       // 0-100
  uniqueness: number;     // 0-100
  consistency: number;   // 0-100
  overall: number;       // 0-100 weighted
}

const WEIGHTS = { completeness: 0.35, validity: 0.3, uniqueness: 0.2, consistency: 0.15 };

/** Compute a deterministic quality score from per-batch counts. */
export function computeQualityScore(c: BatchCounts): QualityScore {
  const received = Math.max(1, c.received);

  // Completeness: fraction of records with no missing-required-field errors
  const missingPenalty = c.missingRequired / received;
  const completeness = clamp100((1 - missingPenalty) * 100);

  // Validity: fraction of records with no invalid-value errors
  const invalidPenalty = c.invalidValues / received;
  const validity = clamp100((1 - invalidPenalty) * 100);

  // Uniqueness: fraction of records that are not duplicates
  const uniqueness = clamp100((1 - c.duplicate / received) * 100);

  // Consistency: fraction of records with no unknown-reference warnings
  const refPenalty = c.unknownReferences / received;
  const consistency = clamp100((1 - refPenalty) * 100);

  const overall = Math.round(
    completeness * WEIGHTS.completeness +
    validity * WEIGHTS.validity +
    uniqueness * WEIGHTS.uniqueness +
    consistency * WEIGHTS.consistency,
  );

  return {
    total: c.received,
    completeness: Math.round(completeness),
    validity: Math.round(validity),
    uniqueness: Math.round(uniqueness),
    consistency: Math.round(consistency),
    overall,
  };
}

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Derive batch terminal status from counts. */
export function deriveBatchStatus(c: BatchCounts): string {
  if (c.accepted === 0 && c.received > 0) return "FAILED";
  if (c.warning > 0 || c.duplicate > 0 || c.rejected > 0) return "COMPLETED_WITH_WARNINGS";
  return "COMPLETED";
}
