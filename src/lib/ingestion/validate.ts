/**
 * KAUSHAL DRISHTI — Phase 2 Validation Schemas + Service
 * ---------------------------------------------------------------------
 * Zod-equivalent validation per entity type. Each validator:
 *  - parses + normalizes the raw record
 *  - checks completeness, validity, referential integrity (via lookups)
 *  - returns { ok: true, normalized } | { ok: false, errors: Issue[] }
 *
 * Referential integrity (district/sector/etc.) is resolved against DB
 * lookups supplied by the caller — the validator itself is pure.
 */
import {
  normalizeWhitespace,
  normalizeTitle,
  normalizeDate,
  normalizeDataStatus,
  normalizeInt,
  normalizeFloat,
  normalizeEnum,
  normalizePeriod,
} from "./normalize";
import type { DataStatus, Severity } from "./vocab";

export interface ValidationIssue {
  field: string;
  problem: string;
  severity: Severity;
  suggestedAction?: string;
}

export interface ValidationResult<T = Record<string, unknown>> {
  ok: boolean;
  normalized?: T;
  issues: ValidationIssue[];
}

/** Lookup tables passed in by the caller (resolved from DB once per batch). */
export interface ReferenceLookups {
  districts: Set<string>;        // lowercased district names
  sectors: Set<string>;          // lowercased sector names
  employers: Set<string>;        // lowercased employer names
  jobRoles: Set<string>;          // lowercased job-role titles
  courses: Set<string>;
  institutions: Set<string>;
  qualifications: Set<string>;
  /** map lowercased district name → district id */
  districtIds: Map<string, string>;
  sectorIds: Map<string, string>;
  employerIds: Map<string, string>;
  jobRoleIds: Map<string, string>;
  courseIds: Map<string, string>;
  institutionIds: Map<string, string>;
}

// ---------------------------------------------------------------------
// JOB POSTING validation
// ---------------------------------------------------------------------

export interface NormalizedJobPosting {
  source_record_id: string;
  employer: string;
  role: string;
  district: string;
  sector?: string;
  posted_at?: string;
  data_status: string;
}

export function validateJobPosting(
  raw: Record<string, unknown>,
  refs: ReferenceLookups,
): ValidationResult<NormalizedJobPosting> {
  const issues: ValidationIssue[] = [];

  const sourceRecordId = normalizeWhitespace(raw.source_record_id);
  if (!sourceRecordId) {
    issues.push({ field: "source_record_id", problem: "Missing source_record_id", severity: "ERROR", suggestedAction: "Provide a unique source record ID" });
  }

  const employer = normalizeTitle(raw.employer);
  if (!employer) {
    issues.push({ field: "employer", problem: "Missing employer", severity: "ERROR", suggestedAction: "Provide the employer name" });
  } else if (!refs.employers.has(employer.toLowerCase())) {
    // Not a hard reject in Phase 2 — we still store the name. Mark as WARNING
    // because referential integrity is unresolved (Phase 3+ will resolve).
    issues.push({ field: "employer", problem: `Unknown employer "${employer}"`, severity: "WARNING", suggestedAction: "Map to a registered employer or create one" });
  }

  const role = normalizeTitle(raw.role);
  if (!role) {
    issues.push({ field: "role", problem: "Missing role", severity: "ERROR", suggestedAction: "Provide the job role title" });
  } else if (!refs.jobRoles.has(role.toLowerCase())) {
    issues.push({ field: "role", problem: `Unknown role "${role}"`, severity: "WARNING", suggestedAction: "Map to a registered job role" });
  }

  const district = normalizeTitle(raw.district);
  if (!district) {
    issues.push({ field: "district", problem: "Missing district", severity: "ERROR", suggestedAction: "Provide the district" });
  } else if (!refs.districts.has(district.toLowerCase())) {
    issues.push({ field: "district", problem: `Unknown district "${district}"`, severity: "ERROR", suggestedAction: "Map to a valid Maharashtra district (Pune, Nashik, Nagpur)" });
  }

  let sector: string | undefined;
  const rawSector = normalizeWhitespace(raw.sector);
  if (rawSector) {
    sector = normalizeTitle(rawSector);
    if (!refs.sectors.has(sector.toLowerCase())) {
      issues.push({ field: "sector", problem: `Unknown sector "${sector}"`, severity: "WARNING", suggestedAction: "Map to a registered sector" });
    }
  }

  let postedAt: string | undefined;
  const rawDate = raw.posted_at;
  if (rawDate == null || rawDate === "") {
    issues.push({ field: "posted_at", problem: "Missing posted_at date", severity: "WARNING", suggestedAction: "Provide the posting date" });
  } else {
    const d = normalizeDate(rawDate);
    if (!d) {
      issues.push({ field: "posted_at", problem: `Invalid date "${rawDate}"`, severity: "ERROR", suggestedAction: "Use YYYY-MM-DD format" });
    } else {
      postedAt = d;
    }
  }

  const dataStatus = normalizeDataStatus(raw.data_status);
  if (!dataStatus) {
    issues.push({ field: "data_status", problem: `Invalid data_status "${raw.data_status}"`, severity: "ERROR", suggestedAction: "Use one of REAL, SYNTHETIC, MODELLED, DEMO, UNKNOWN" });
  }

  if (issues.some((i) => i.severity === "ERROR")) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    issues,
    normalized: {
      source_record_id: sourceRecordId,
      employer,
      role,
      district,
      sector,
      posted_at: postedAt,
      data_status: (dataStatus ?? "UNKNOWN") as DataStatus,
    },
  };
}

// ---------------------------------------------------------------------
// Compound fingerprint for deduplication
// ---------------------------------------------------------------------

/** Build a deterministic sha-256-like fingerprint from key fields. */
export function fingerprintJobPosting(rec: NormalizedJobPosting): string {
  // employer + role + district + posted_at (date, no time)
  const key = [rec.employer.toLowerCase(), rec.role.toLowerCase(), rec.district.toLowerCase(), rec.posted_at ?? ""].join("|");
  return simpleHash(key);
}

/** Non-crypto hash (FNV-1a 64-bit-ish) — sufficient for fingerprinting. */
export function simpleHash(s: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const lo = (h2 >>> 0).toString(16).padStart(8, "0");
  const hi = (h1 >>> 0).toString(16).padStart(8, "0");
  return hi + lo;
}

// ---------------------------------------------------------------------
// Other entity validators (simplified for Phase 2 — same pattern)
// ---------------------------------------------------------------------

export function validateEmployerSurvey(raw: Record<string, unknown>, refs: ReferenceLookups): ValidationResult<Record<string, unknown>> {
  const issues: ValidationIssue[] = [];
  const employer = normalizeTitle(raw.employer);
  if (!employer) issues.push({ field: "employer", problem: "Missing employer", severity: "ERROR" });
  const responseDate = raw.response_date ? normalizeDate(raw.response_date) : null;
  if (raw.response_date && !responseDate) issues.push({ field: "response_date", problem: `Invalid date "${raw.response_date}"`, severity: "ERROR" });
  const satisfaction = normalizeInt(raw.satisfaction_score);
  if (satisfaction != null && (satisfaction < 1 || satisfaction > 5)) issues.push({ field: "satisfaction_score", problem: "satisfaction_score must be 1-5", severity: "ERROR" });
  const dataStatus = normalizeDataStatus(raw.data_status);
  if (!dataStatus) issues.push({ field: "data_status", problem: `Invalid data_status "${raw.data_status}"`, severity: "ERROR" });
  if (issues.some((i) => i.severity === "ERROR")) return { ok: false, issues };
  return { ok: true, issues, normalized: { employer, response_date: responseDate, satisfaction_score: satisfaction, data_status: dataStatus ?? "UNKNOWN", role: normalizeTitle(raw.role), district: normalizeTitle(raw.district) } };
}

export function validateIndustryConsultation(raw: Record<string, unknown>, refs: ReferenceLookups): ValidationResult<Record<string, unknown>> {
  const issues: ValidationIssue[] = [];
  const organization = normalizeWhitespace(raw.organization);
  if (!organization) issues.push({ field: "organization", problem: "Missing organization", severity: "ERROR" });
  const sector = normalizeTitle(raw.sector);
  if (sector && !refs.sectors.has(sector.toLowerCase())) issues.push({ field: "sector", problem: `Unknown sector "${sector}"`, severity: "WARNING" });
  const date = raw.consultation_date ? normalizeDate(raw.consultation_date) : null;
  if (raw.consultation_date && !date) issues.push({ field: "consultation_date", problem: `Invalid date "${raw.consultation_date}"`, severity: "ERROR" });
  const dataStatus = normalizeDataStatus(raw.data_status);
  if (!dataStatus) issues.push({ field: "data_status", problem: `Invalid data_status "${raw.data_status}"`, severity: "ERROR" });
  if (issues.some((i) => i.severity === "ERROR")) return { ok: false, issues };
  return { ok: true, issues, normalized: { organization, sector, consultation_date: date, key_findings: normalizeWhitespace(raw.key_findings), data_status: dataStatus ?? "UNKNOWN" } };
}

export function validateSectorGrowth(raw: Record<string, unknown>, refs: ReferenceLookups): ValidationResult<Record<string, unknown>> {
  const issues: ValidationIssue[] = [];
  const sectorName = normalizeTitle(raw.sector);
  if (!sectorName) issues.push({ field: "sector", problem: "Missing sector", severity: "ERROR" });
  const geography = normalizeWhitespace(raw.geography);
  if (!geography) issues.push({ field: "geography", problem: "Missing geography", severity: "ERROR" });
  const period = normalizePeriod(raw.period);
  if (!period) issues.push({ field: "period", problem: "Missing period", severity: "ERROR" });
  const growth = normalizeFloat(raw.growth_rate_pct);
  if (growth != null && (growth < -100 || growth > 1000)) issues.push({ field: "growth_rate_pct", problem: "growth_rate_pct out of range", severity: "ERROR" });
  const dataStatus = normalizeDataStatus(raw.data_status);
  if (!dataStatus) issues.push({ field: "data_status", problem: `Invalid data_status "${raw.data_status}"`, severity: "ERROR" });
  if (issues.some((i) => i.severity === "ERROR")) return { ok: false, issues };
  return { ok: true, issues, normalized: { sector: sectorName, geography, period, growth_rate_pct: growth, data_status: dataStatus ?? "UNKNOWN" } };
}

export function validatePlacementOutcome(raw: Record<string, unknown>, refs: ReferenceLookups): ValidationResult<Record<string, unknown>> {
  const issues: ValidationIssue[] = [];
  const courseName = normalizeTitle(raw.course);
  if (!courseName) issues.push({ field: "course", problem: "Missing course", severity: "ERROR" });
  const period = normalizePeriod(raw.period);
  if (!period) issues.push({ field: "period", problem: "Missing period", severity: "ERROR" });
  const total = normalizeInt(raw.total_candidates);
  if (total == null) issues.push({ field: "total_candidates", problem: "Missing total_candidates", severity: "ERROR" });
  const placed = normalizeInt(raw.placed_count);
  if (placed == null) issues.push({ field: "placed_count", problem: "Missing placed_count", severity: "ERROR" });
  if (total != null && placed != null && placed > total) issues.push({ field: "placed_count", problem: "placed_count exceeds total_candidates", severity: "ERROR" });
  const dataStatus = normalizeDataStatus(raw.data_status);
  if (!dataStatus) issues.push({ field: "data_status", problem: `Invalid data_status "${raw.data_status}"`, severity: "ERROR" });
  if (issues.some((i) => i.severity === "ERROR")) return { ok: false, issues };
  const rate = total && placed != null ? (placed / total) * 100 : null;
  return { ok: true, issues, normalized: { course: courseName, institution: normalizeTitle(raw.institution), period, total_candidates: total, placed_count: placed, placement_rate: rate, data_status: dataStatus ?? "UNKNOWN" } };
}

export function validateTechnologyTrend(raw: Record<string, unknown>, refs: ReferenceLookups): ValidationResult<Record<string, unknown>> {
  const issues: ValidationIssue[] = [];
  const technology = normalizeTitle(raw.technology);
  if (!technology) issues.push({ field: "technology", problem: "Missing technology", severity: "ERROR" });
  const trendDirection = normalizeEnum(raw.trend_direction);
  if (!["RISING", "STABLE", "DECLINING", "EMERGING"].includes(trendDirection)) issues.push({ field: "trend_direction", problem: `Invalid trend_direction "${raw.trend_direction}"`, severity: "ERROR" });
  const impact = normalizeInt(raw.impact_level);
  if (impact != null && (impact < 1 || impact > 5)) issues.push({ field: "impact_level", problem: "impact_level must be 1-5", severity: "ERROR" });
  const dataStatus = normalizeDataStatus(raw.data_status);
  if (!dataStatus) issues.push({ field: "data_status", problem: `Invalid data_status "${raw.data_status}"`, severity: "ERROR" });
  if (issues.some((i) => i.severity === "ERROR")) return { ok: false, issues };
  return { ok: true, issues, normalized: { technology, sector: normalizeTitle(raw.sector), trend_direction: trendDirection, impact_level: impact, time_horizon: normalizeWhitespace(raw.time_horizon), data_status: dataStatus ?? "UNKNOWN" } };
}

/** Dispatch validation by entity type. */
export function validateRecord(
  entityType: string,
  raw: Record<string, unknown>,
  refs: ReferenceLookups,
): ValidationResult {
  switch (entityType) {
    case "job_posting": return validateJobPosting(raw, refs);
    case "employer_survey": return validateEmployerSurvey(raw, refs);
    case "industry_consultation": return validateIndustryConsultation(raw, refs);
    case "sector_growth": return validateSectorGrowth(raw, refs);
    case "placement_outcome": return validatePlacementOutcome(raw, refs);
    case "technology_trend": return validateTechnologyTrend(raw, refs);
    default:
      return { ok: false, issues: [{ field: "_entity", problem: `Unknown entity type ${entityType}`, severity: "ERROR" }] };
  }
}
