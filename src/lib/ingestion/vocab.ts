/**
 * KAUSHAL DRISHTI — Phase 2 Entity Vocabularies
 * Centralised controlled vocabularies for ingestion validation.
 */
export const SOURCE_TYPES = [
  "JOB_POSTINGS",
  "EMPLOYER_SURVEY",
  "INDUSTRY_CONSULTATION",
  "SECTOR_GROWTH",
  "PLACEMENT_OUTCOME",
  "TECHNOLOGY_TREND",
  "TRAINING_DATA",
  "COURSE_DATA",
  "INSTITUTION_DATA",
  "TRAINER_DATA",
  "EQUIPMENT_DATA",
  "OTHER",
] as const;

export const DATA_STATUS = ["REAL", "SYNTHETIC", "MODELLED", "DEMO", "UNKNOWN"] as const;
export const GEOGRAPHY_LEVEL = [
  "STATE", "DIVISION", "DISTRICT", "TALUKA",
  "INSTITUTION", "EMPLOYER", "NATIONAL", "OTHER",
] as const;
export const UPDATE_FREQUENCY = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "ADHOC"] as const;

export const BATCH_STATUS = [
  "UPLOADED", "VALIDATING", "PROCESSING",
  "COMPLETED", "COMPLETED_WITH_WARNINGS", "FAILED", "CANCELLED",
] as const;

export const IMPORT_MODES = ["REPLACE", "APPEND", "UPSERT"] as const;

export const SEVERITY = ["ERROR", "WARNING", "INFO"] as const;

export const QUALITY_STATUS = ["ACCEPTED", "REJECTED", "POSSIBLE_DUPLICATE", "DUPLICATE"] as const;

export const ENTITY_TYPES = [
  "job_posting",
  "employer_survey",
  "industry_consultation",
  "sector_growth",
  "placement_outcome",
  "technology_trend",
] as const;

export const AUDIT_ACTIONS = [
  "UPLOADED_DATASET",
  "VALIDATED_DATASET",
  "CONFIRMED_IMPORT",
  "CREATED_SOURCE",
  "UPDATED_SOURCE",
  "DELETED_SOURCE",
  "LOGIN",
  "LOGOUT",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
export type DataStatus = (typeof DATA_STATUS)[number];
export type Severity = (typeof SEVERITY)[number];
export type QualityStatus = (typeof QUALITY_STATUS)[number];

/** Maps a source_type to the entity it ingests. */
export function entityTypeForSourceType(sourceType: string): EntityType | null {
  switch (sourceType) {
    case "JOB_POSTINGS": return "job_posting";
    case "EMPLOYER_SURVEY": return "employer_survey";
    case "INDUSTRY_CONSULTATION": return "industry_consultation";
    case "SECTOR_GROWTH": return "sector_growth";
    case "PLACEMENT_OUTCOME": return "placement_outcome";
    case "TECHNOLOGY_TREND": return "technology_trend";
    default: return null;
  }
}
