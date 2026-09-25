/**
 * KAUSHAL DRISHTI — Phase 3 Skill Vocabulary
 * Controlled vocabularies for the knowledge + competency foundation.
 */
export const PROFICIENCY_LEVELS = ["AWARENESS", "WORKING", "PROFICIENT", "EXPERT"] as const;
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

/** Numeric ordering of proficiency for comparison (NOT a labour-market score). */
export const PROFICIENCY_RANK: Record<ProficiencyLevel, number> = {
  AWARENESS: 1,
  WORKING: 2,
  PROFICIENT: 3,
  EXPERT: 4,
};

export const COVERAGE_LEVELS = ["NONE", "INTRODUCED", "REINFORCED", "MASTERED"] as const;
export type CoverageLevel = (typeof COVERAGE_LEVELS)[number];

/** Map a course coverage level to the highest proficiency it can confer. */
export const COVERAGE_TO_PROFICIENCY: Record<CoverageLevel, ProficiencyLevel> = {
  NONE: "AWARENESS",
  INTRODUCED: "AWARENESS",
  REINFORCED: "WORKING",
  MASTERED: "PROFICIENT",
};

export const ALIAS_TYPES = ["ACRONYM", "VARIANT", "COMMON_NAME", "LEGACY"] as const;
export type AliasType = (typeof ALIAS_TYPES)[number];

export const RELATION_TYPES = [
  "PREREQUISITE",
  "RELATED_TO",
  "BROADER_THAN",
  "NARROWER_THAN",
  "PART_OF",
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const CLUSTER_MEMBERSHIP = ["PRIMARY", "SECONDARY"] as const;

export function isValidProficiency(v: string): v is ProficiencyLevel {
  return (PROFICIENCY_LEVELS as readonly string[]).includes(v);
}
export function isValidCoverage(v: string): v is CoverageLevel {
  return (COVERAGE_LEVELS as readonly string[]).includes(v);
}
export function isValidRelationType(v: string): v is RelationType {
  return (RELATION_TYPES as readonly string[]).includes(v);
}
