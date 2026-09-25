/**
 * KAUSHAL DRISHTI — Phase 4 Market Vocabularies
 * Controlled vocabularies + configurable evidence weights.
 */
export const MARKET_SOURCE_TYPES = [
  "JOB_POSTING",
  "EMPLOYER_SURVEY",
  "INDUSTRY_CONSULTATION",
  "SECTOR_GROWTH",
  "PLACEMENT_OUTCOME",
  "TECHNOLOGY_TREND",
  "ADMINISTRATIVE_SIGNAL",
  "INDUSTRY_DATA",
  "CLUSTER_SIGNAL",
] as const;
export type MarketSourceType = (typeof MARKET_SOURCE_TYPES)[number];

export const SIGNAL_DIRECTION = ["INCREASING", "STABLE", "DECREASING", "UNKNOWN"] as const;
export type SignalDirection = (typeof SIGNAL_DIRECTION)[number];

export const GROWTH_DIRECTION = ["INCREASING", "STABLE", "DECREASING", "INSUFFICIENT_DATA"] as const;

export const EMERGENCE_STATUS = [
  "EARLY_SIGNAL",
  "EMERGING",
  "ACCELERATING",
  "INSUFFICIENT_EVIDENCE",
] as const;
export type EmergenceStatus = (typeof EMERGENCE_STATUS)[number];

export const CONVERGENCE_STATUS = ["CONVERGING", "MIXED", "LIMITED_EVIDENCE", "INSUFFICIENT_DATA"] as const;
export type ConvergenceStatus = (typeof CONVERGENCE_STATUS)[number];

export const CONFIDENCE_LEVEL = ["HIGH", "MEDIUM", "LOW", "INSUFFICIENT"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVEL)[number];

export const MARKET_SCOPE = ["STATE", "DISTRICT", "CLUSTER", "SECTOR"] as const;

export const PROFICIENCY_VALUES = ["AWARENESS", "WORKING", "PROFICIENT", "EXPERT", "UNKNOWN"] as const;

/**
 * Default prototype evidence weights. NOT scientifically validated.
 * Documented as: "Initial system configuration — subject to validation."
 */
export const DEFAULT_EVIDENCE_WEIGHTS: Record<string, { weight: number; reliability: number }> = {
  JOB_POSTING: { weight: 1.0, reliability: 0.7 },
  EMPLOYER_SURVEY: { weight: 0.9, reliability: 0.75 },
  INDUSTRY_CONSULTATION: { weight: 0.7, reliability: 0.65 },
  SECTOR_GROWTH: { weight: 0.6, reliability: 0.6 },
  PLACEMENT_OUTCOME: { weight: 0.5, reliability: 0.55 },
  TECHNOLOGY_TREND: { weight: 0.6, reliability: 0.55 },
  ADMINISTRATIVE_SIGNAL: { weight: 0.4, reliability: 0.5 },
  INDUSTRY_DATA: { weight: 0.5, reliability: 0.5 },
  CLUSTER_SIGNAL: { weight: 0.6, reliability: 0.55 },
};

export function confidenceToLevel(score: number): ConfidenceLevel {
  if (score >= 0.7) return "HIGH";
  if (score >= 0.4) return "MEDIUM";
  if (score > 0) return "LOW";
  return "INSUFFICIENT";
}

export function signalStrengthLabel(value: number): "NONE" | "LOW" | "MEDIUM" | "HIGH" {
  if (value >= 70) return "HIGH";
  if (value >= 35) return "MEDIUM";
  if (value > 0) return "LOW";
  return "NONE";
}
