"use client";

// Candidate-facing proficiency vocabulary mapping.
// The DB stores AWARENESS / WORKING / PROFICIENT / EXPERT.
// The candidate UI surfaces the friendlier Basic / Intermediate / Advanced / Expert ladder.
export const PROF_LABEL: Record<string, string> = {
  AWARENESS: "Basic",
  WORKING: "Intermediate",
  PROFICIENT: "Advanced",
  EXPERT: "Expert",
};

export const PROF_ORDER = ["AWARENESS", "WORKING", "PROFICIENT", "EXPERT"];

export const profLabel = (p: string | null | undefined): string => (p && PROF_LABEL[p]) ? PROF_LABEL[p] : (p ?? "—");

export const profRank = (p: string | null | undefined): number => {
  if (!p) return -1;
  const i = PROF_ORDER.indexOf(p);
  return i;
};

// Returns a human gap label given required + demonstrated DB proficiencies.
export const gapLabel = (required: string | null | undefined, demonstrated: string | null | undefined): string => {
  if (!demonstrated) return "Missing skill";
  const r = profRank(required);
  const d = profRank(demonstrated);
  if (d >= r) return "None (aligned)";
  const diff = r - d;
  if (diff >= 2) return "High";
  if (diff === 1) return "Medium";
  return "Low";
};

export const gapTone = (label: string): "positive" | "info" | "attention" | "critical" => {
  if (label.startsWith("None")) return "positive";
  if (label === "Missing skill") return "critical";
  if (label === "High") return "critical";
  if (label === "Medium") return "attention";
  return "info";
};

export const freshnessTone = (f: string | null | undefined): "positive" | "info" | "attention" | "neutral" => {
  if (f === "CURRENT") return "positive";
  if (f === "RECENT") return "info";
  if (f === "AGING") return "attention";
  if (f === "STALE") return "attention";
  return "neutral";
};

export const freshnessLabel = (f: string | null | undefined): string => {
  if (f === "CURRENT") return "Recent";
  if (f === "RECENT") return "Recent";
  if (f === "AGING") return "Ageing";
  if (f === "STALE") return "Outdated";
  return "Unknown";
};

export const evidenceTypeLabel = (t: string): string => {
  const map: Record<string, string> = {
    SELF_DECLARED: "Self Declaration",
    ASSESSED: "Assessment",
    CERTIFIED: "Certificate",
    PROJECT: "Project",
    EXPERIENCE: "Practice / Activity",
    EMPLOYER_VERIFIED: "Employer Validation",
    SYSTEM_INFERRED: "Verified Evidence",
    UNKNOWN: "Evidence",
  };
  return map[t] ?? t;
};

export const evidenceTypeIcon = (t: string): string => {
  const map: Record<string, string> = {
    SELF_DECLARED: "User",
    ASSESSED: "ClipboardCheck",
    CERTIFIED: "Award",
    PROJECT: "Briefcase",
    EXPERIENCE: "Activity",
    EMPLOYER_VERIFIED: "ShieldCheck",
    SYSTEM_INFERRED: "BadgeCheck",
    UNKNOWN: "FileText",
  };
  return map[t] ?? "FileText";
};
