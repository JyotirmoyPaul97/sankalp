/**
 * KAUSHAL DRISHTI — Phase 4 Market Intelligence Service
 * ---------------------------------------------------------------------
 * Aggregates Phase 2 evidence (JobPosting, EmployerSurvey, etc.) through
 * the Phase 3 semantic layer (canonical skills/roles) into:
 *   - MarketSignal rows (per source-type × entity × period — never overwritten)
 *   - DemandSnapshot rows (the single market-intelligence object)
 *   - EmergingSkillSignal rows (radar)
 *   - SkillSectorPresence rows (cross-sector visibility)
 *   - SectorGrowthProfile rows
 *
 * Pipeline: RAW EVIDENCE → PHASE 2 PROVENANCE → PHASE 3 CANONICAL ENTITY
 *          → JOB ROLE → COMPETENCY → SKILL → PROFICIENCY → LOCATION
 *          → MARKET SIGNAL
 *
 * NO demand-supply gap, NO candidate gap, NO forecasting, NO recommendations.
 */
import { db } from "@/lib/db";
import {
  DEFAULT_EVIDENCE_WEIGHTS,
  confidenceToLevel,
  signalStrengthLabel,
  type ConfidenceLevel,
  type SignalDirection,
  type ConvergenceStatus,
} from "./market-vocab";

// ---------------------------------------------------------------------
// 1. Evidence-weight configuration (load from DB or defaults)
// ---------------------------------------------------------------------

export async function getEvidenceWeights(): Promise<Record<string, { weight: number; reliability: number }>> {
  const rows = await db.evidenceWeight.findMany();
  if (rows.length === 0) return DEFAULT_EVIDENCE_WEIGHTS;
  const out: Record<string, { weight: number; reliability: number }> = {};
  for (const r of rows) out[r.sourceType] = { weight: r.weight, reliability: r.reliability };
  return { ...DEFAULT_EVIDENCE_WEIGHTS, ...out };
}

// ---------------------------------------------------------------------
// 2. Market Signal computation
// ---------------------------------------------------------------------

export interface ComputeOptions {
  periodLabel: string;       // e.g. "2026-09"
  periodStart: Date;
  periodEnd: Date;
  // optional lookback window for trend computation
  previousPeriodLabel?: string;
  previousPeriodStart?: Date;
  previousPeriodEnd?: Date;
}

/**
 * Scan evidence tables for the given period and upsert MarketSignal rows.
 * Idempotent within a period (uses @@unique constraint).
 *
 * We DO NOT recompute history. Historical observations are preserved.
 */
export async function computeMarketSignals(opts: ComputeOptions): Promise<{ signalsCreated: number; signalsUpdated: number }> {
  const weights = await getEvidenceWeights();
  let created = 0;
  let updated = 0;

  // ---- 2a. JOB_POSTING signals grouped by (district, cluster, sector, role, skill) ----
  // Each job posting contributes to: 1 role signal + N skill signals (via RoleSkill)
  const postings = await db.jobPosting.findMany({
    where: {
      postedAt: { gte: opts.periodStart, lte: opts.periodEnd },
    },
    include: {
      jobRole: { include: { roleSkills: { include: { skill: true } } } },
      district: true,
      sector: true,
    },
  });

  // Aggregate by composite key
  type SigKey = string;
  const sigMap = new Map<SigKey, {
    sourceType: string;
    districtId?: string;
    clusterId?: string;
    sectorId?: string;
    jobRoleId?: string;
    skillId?: string;
    count: number;
    employers: Set<string>;
    postings: Set<string>;
    dataStatus: string;
  }>();

  const upsertSig = (k: SigKey, v: Partial<{ sourceType: string; districtId?: string; clusterId?: string; sectorId?: string; jobRoleId?: string; skillId?: string; employerId?: string; postingId?: string; dataStatus?: string }>) => {
    const ex = sigMap.get(k) ?? {
      sourceType: v.sourceType!,
      districtId: v.districtId,
      clusterId: v.clusterId,
      sectorId: v.sectorId,
      jobRoleId: v.jobRoleId,
      skillId: v.skillId,
      count: 0,
      employers: new Set<string>(),
      postings: new Set<string>(),
      dataStatus: v.dataStatus ?? "DEMO",
    };
    ex.count++;
    if (v.employerId) ex.employers.add(v.employerId);
    if (v.postingId) ex.postings.add(v.postingId);
    sigMap.set(k, ex);
  };

  for (const p of postings) {
    const dataStatus = p.dataStatus;
    // 1. Role-level signal
    if (p.jobRoleId) {
      const key = `JOB_POSTING|${p.districtId ?? ""}|${p.economicClusterId ?? ""}|${p.sectorId ?? ""}|${p.jobRoleId}|`;
      upsertSig(key, {
        sourceType: "JOB_POSTING",
        districtId: p.districtId ?? undefined,
        clusterId: p.economicClusterId ?? undefined,
        sectorId: p.sectorId ?? undefined,
        jobRoleId: p.jobRoleId,
        employerId: p.employerId ?? undefined,
        postingId: p.id,
        dataStatus,
      });
    }
    // 2. Skill-level signals (via role's RoleSkill links)
    if (p.jobRole) {
      for (const rs of p.jobRole.roleSkills) {
        const key = `JOB_POSTING|${p.districtId ?? ""}|${p.economicClusterId ?? ""}|${p.sectorId ?? ""}|${p.jobRoleId ?? ""}|${rs.skillId}`;
        upsertSig(key, {
          sourceType: "JOB_POSTING",
          districtId: p.districtId ?? undefined,
          clusterId: p.economicClusterId ?? undefined,
          sectorId: p.sectorId ?? undefined,
          jobRoleId: p.jobRoleId ?? undefined,
          skillId: rs.skillId,
          employerId: p.employerId ?? undefined,
          postingId: p.id,
          dataStatus,
        });
      }
    }
  }

  // Persist JOB_POSTING signals
  for (const [, sig] of sigMap) {
    const w = weights[sig.sourceType] ?? { weight: 1, reliability: 0.5 };
    const confidence = Math.min(1, (sig.count / 50) * w.reliability);
    const direction = await computeDirection(sig.sourceType, sig, opts);
    const result = await db.marketSignal.upsert({
      where: {
        sourceType_districtId_clusterId_sectorId_jobRoleId_skillId_periodLabel: {
          sourceType: sig.sourceType,
          districtId: sig.districtId ?? "",
          clusterId: sig.clusterId ?? "",
          sectorId: sig.sectorId ?? "",
          jobRoleId: sig.jobRoleId ?? "",
          skillId: sig.skillId ?? "",
          periodLabel: opts.periodLabel,
        },
      },
      update: {
        signalValue: sig.count,
        direction,
        confidence,
        sourceDiversity: 1,
        sampleSize: sig.count,
        uniqueEmployers: sig.employers.size,
        uniquePostings: sig.postings.size,
        dataStatus: sig.dataStatus,
      },
      create: {
        sourceType: sig.sourceType,
        districtId: sig.districtId ?? null,
        clusterId: sig.clusterId ?? null,
        sectorId: sig.sectorId ?? null,
        jobRoleId: sig.jobRoleId ?? null,
        skillId: sig.skillId ?? null,
        periodStart: opts.periodStart,
        periodEnd: opts.periodEnd,
        periodLabel: opts.periodLabel,
        signalValue: sig.count,
        signalUnit: "count",
        direction,
        confidence,
        sourceDiversity: 1,
        sampleSize: sig.count,
        uniqueEmployers: sig.employers.size,
        uniquePostings: sig.postings.size,
        dataStatus: sig.dataStatus,
      },
    });
    if (result) created++;
  }

  // ---- 2b. EMPLOYER_SURVEY signals (skill importance → mandatory/preferred) ----
  const surveys = await db.employerSurvey.findMany({
    where: { responseDate: { gte: opts.periodStart, lte: opts.periodEnd } },
    include: { employer: true, jobRole: { include: { roleSkills: { include: { skill: true } } } } },
  });
  const surveyMap = new Map<string, { count: number; employers: Set<string>; dataStatus: string; districtId?: string; sectorId?: string }>();
  for (const s of surveys) {
    if (!s.jobRole) continue;
    for (const rs of s.jobRole.roleSkills) {
      const key = `EMPLOYER_SURVEY|${s.employer?.districtId ?? ""}||${s.employer?.industrySectorId ?? ""}|${s.jobRoleId ?? ""}|${rs.skillId}`;
      const ex = surveyMap.get(key) ?? { count: 0, employers: new Set<string>(), dataStatus: s.dataStatus, districtId: s.employer?.districtId ?? undefined, sectorId: s.employer?.industrySectorId ?? undefined };
      ex.count++;
      if (s.employerId) ex.employers.add(s.employerId);
      surveyMap.set(key, ex);
    }
  }
  for (const [, sig] of surveyMap) {
    const w = weights.EMPLOYER_SURVEY;
    const confidence = Math.min(1, (sig.count / 30) * w.reliability);
    const direction = await computeDirection("EMPLOYER_SURVEY", sig, opts);
    const r = await db.marketSignal.upsert({
      where: {
        sourceType_districtId_clusterId_sectorId_jobRoleId_skillId_periodLabel: {
          sourceType: "EMPLOYER_SURVEY",
          districtId: sig.districtId ?? "",
          clusterId: "",
          sectorId: sig.sectorId ?? "",
          jobRoleId: "",
          skillId: sig.skillId ?? "",
          periodLabel: opts.periodLabel,
        },
      },
      update: {
        signalValue: sig.count, direction, confidence, sampleSize: sig.count,
        uniqueEmployers: sig.employers.size, uniquePostings: 0, dataStatus: sig.dataStatus,
      },
      create: {
        sourceType: "EMPLOYER_SURVEY",
        districtId: sig.districtId ?? null,
        sectorId: sig.sectorId ?? null,
        periodStart: opts.periodStart, periodEnd: opts.periodEnd, periodLabel: opts.periodLabel,
        signalValue: sig.count, direction, confidence, sampleSize: sig.count,
        uniqueEmployers: sig.employers.size, dataStatus: sig.dataStatus,
      },
    });
    if (r) created++;
  }
  void updated;
  return { signalsCreated: created, signalsUpdated: updated };
}

/** Compare current-period signal vs previous-period → direction.
 *  Sums ALL signals matching the same (sourceType, skillId/jobRoleId) across
 *  each period to get a stable aggregate, then compares totals. */
async function computeDirection(
  sourceType: string,
  sig: { count: number; jobRoleId?: string; skillId?: string; districtId?: string; sectorId?: string },
  opts: ComputeOptions,
): Promise<SignalDirection> {
  if (!opts.previousPeriodLabel) return "UNKNOWN";
  const prevSignals = await db.marketSignal.aggregate({
    _sum: { signalValue: true },
    where: {
      sourceType,
      periodLabel: opts.previousPeriodLabel,
      ...(sig.skillId ? { skillId: sig.skillId } : {}),
      ...(sig.jobRoleId ? { jobRoleId: sig.jobRoleId } : {}),
    },
  });
  const prevTotal = prevSignals._sum.signalValue ?? 0;
  if (prevTotal === 0) return "UNKNOWN";
  const ratio = sig.count / prevTotal;
  if (ratio >= 1.15) return "INCREASING";
  if (ratio <= 0.85) return "DECREASING";
  return "STABLE";
}

// ---------------------------------------------------------------------
// 3. Demand Snapshot — the single market-intelligence object
// ---------------------------------------------------------------------

export interface MarketIntelligenceObject {
  // Scope
  scope: string;
  geographyId: string | null;
  geographyName: string | null;
  sectorId: string | null;
  sectorName: string | null;
  jobRoleId: string | null;
  roleTitle: string | null;
  skillId: string | null;
  skillName: string | null;
  period: string;

  // Signal
  signalStrength: number;
  signalLabel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  trendDirection: SignalDirection;

  // Evidence
  evidenceCount: number;
  sourceDiversity: number;
  sampleSize: number;
  uniqueEmployers: number;
  uniquePostings: number;

  // Proficiency
  proficiencyDistribution: Record<string, number> | null;

  // Confidence
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  convergence: ConvergenceStatus;
  sourceBreakdown: { sourceType: string; signalValue: number; direction: string; employers: number }[];

  // Provenance
  dataStatus: string;
  dataFreshness: string;
  lastRefreshed: string;

  // Methodology
  methodology: string;
}

/**
 * Build the single Market Intelligence Object for any
 * (district?, cluster?, sector?, role?, skill?) × period.
 *
 * This is the reusable foundation for Phase 5+.
 */
export async function getMarketIntelligence(params: {
  districtId?: string;
  clusterId?: string;
  sectorId?: string;
  jobRoleId?: string;
  skillId?: string;
  period?: string;
}): Promise<MarketIntelligenceObject | null> {
  const period = params.period ?? await latestPeriod() ?? "UNKNOWN";
  if (period === "UNKNOWN") {
    return sparseMarketIntelligence(params, period);
  }

  // Gather all MarketSignals matching the scope for this period
  const signals = await db.marketSignal.findMany({
    where: {
      periodLabel: period,
      ...(params.districtId ? { districtId: params.districtId } : {}),
      ...(params.clusterId ? { clusterId: params.clusterId } : {}),
      ...(params.sectorId ? { sectorId: params.sectorId } : {}),
      ...(params.jobRoleId ? { jobRoleId: params.jobRoleId } : {}),
      ...(params.skillId ? { skillId: params.skillId } : {}),
    },
  });

  if (signals.length === 0) {
    return sparseMarketIntelligence(params, period);
  }

  const weights = await getEvidenceWeights();
  // Aggregate per source-type first (sum signalValues), THEN apply weights.
  // This prevents per-signal weight accumulation from diluting the signal.
  const perSource = new Map<string, { sum: number; employers: number; postings: number; directions: SignalDirection[] }>();
  for (const s of signals) {
    const ex = perSource.get(s.sourceType) ?? { sum: 0, employers: 0, postings: 0, directions: [] };
    ex.sum += s.signalValue;
    ex.employers += s.uniqueEmployers;
    ex.postings += s.uniquePostings;
    ex.directions.push(s.direction as SignalDirection);
    perSource.set(s.sourceType, ex);
  }

  let totalWeightedSignal = 0;
  let totalWeight = 0;
  let uniqueEmployers = 0;
  let uniquePostings = 0;
  const sourceSet = new Set<string>();
  const sourceBreakdown: MarketIntelligenceObject["sourceBreakdown"] = [];
  const directions: SignalDirection[] = [];
  let evidenceCount = 0;
  let sampleSize = 0;

  for (const [sourceType, agg] of perSource) {
    const w = weights[sourceType] ?? { weight: 1, reliability: 0.5 };
    totalWeightedSignal += agg.sum * w.weight;
    totalWeight += w.weight;
    uniqueEmployers += agg.employers;
    uniquePostings += agg.postings;
    sourceSet.add(sourceType);
    directions.push(...agg.directions);
    sourceBreakdown.push({
      sourceType,
      signalValue: agg.sum,
      direction: majorityDirection(agg.directions),
      employers: agg.employers,
    });
    // evidenceCount + sampleSize: sum the raw counts from the original signals
  }
  for (const s of signals) {
    evidenceCount += s.sampleSize;
    sampleSize += s.signalValue;
  }

  // Normalised signal strength (0-100). Scale factor calibrated for demo data.
  const rawSignal = totalWeight > 0 ? totalWeightedSignal / totalWeight : 0;
  const signalStrength = Math.min(100, Math.round(rawSignal * 2)); // scale factor: 50 signals = 100
  const signalLabel = signalStrengthLabel(signalStrength);

  // Trend: derive from the full time-series (sum per period across ALL periods)
  // rather than per-signal direction fields (which are noisy for small per-signal counts).
  let trendDirection: SignalDirection;
  const allPeriodSignals = await db.marketSignal.findMany({
    where: {
      ...(params.skillId ? { skillId: params.skillId } : {}),
      ...(params.jobRoleId ? { jobRoleId: params.jobRoleId } : {}),
      ...(params.sectorId ? { sectorId: params.sectorId } : {}),
      ...(params.districtId ? { districtId: params.districtId } : {}),
      ...(params.clusterId ? { clusterId: params.clusterId } : {}),
    },
    select: { periodLabel: true, signalValue: true },
  });
  const byPeriodMap = new Map<string, number>();
  for (const s of allPeriodSignals) {
    byPeriodMap.set(s.periodLabel, (byPeriodMap.get(s.periodLabel) ?? 0) + s.signalValue);
  }
  const sortedPeriods = [...byPeriodMap.keys()].sort();
  if (sortedPeriods.length >= 2) {
    const latest = sortedPeriods[sortedPeriods.length - 1];
    const previous = sortedPeriods[sortedPeriods.length - 2];
    const latestSum = byPeriodMap.get(latest) ?? 0;
    const prevSum = byPeriodMap.get(previous) ?? 0;
    if (prevSum === 0) trendDirection = "UNKNOWN";
    else {
      const ratio = latestSum / prevSum;
      trendDirection = ratio >= 1.15 ? "INCREASING" : ratio <= 0.85 ? "DECREASING" : "STABLE";
    }
  } else {
    trendDirection = majorityDirection(directions);
  }

  // Confidence: composite of source diversity, sample size, evidence count
  const confidence = computeConfidence({
    sourceDiversity: sourceSet.size,
    evidenceCount,
    sampleSize,
    uniqueEmployers,
  });
  const confidenceLevel = confidenceToLevel(confidence);

  // Convergence: do sources agree on direction?
  const convergence = computeConvergence(directions);

  // Proficiency distribution from RoleSkill.proficiencyLevel (when role is in scope)
  let proficiencyDistribution: Record<string, number> | null = null;
  if (params.jobRoleId) {
    proficiencyDistribution = await getProficiencyDistribution(params.jobRoleId, params.skillId);
  }

  // Resolve names
  const [district, cluster, sector, role, skill] = await Promise.all([
    params.districtId ? db.district.findUnique({ where: { id: params.districtId } }) : null,
    params.clusterId ? db.economicCluster.findUnique({ where: { id: params.clusterId } }) : null,
    params.sectorId ? db.sector.findUnique({ where: { id: params.sectorId } }) : null,
    params.jobRoleId ? db.jobRole.findUnique({ where: { id: params.jobRoleId } }) : null,
    params.skillId ? db.skill.findUnique({ where: { id: params.skillId } }) : null,
  ]);

  const scope = params.districtId ? "DISTRICT" : params.clusterId ? "CLUSTER" : params.sectorId ? "SECTOR" : "STATE";

  return {
    scope,
    geographyId: params.districtId ?? params.clusterId ?? null,
    geographyName: district?.name ?? cluster?.name ?? null,
    sectorId: params.sectorId ?? null,
    sectorName: sector?.name ?? null,
    jobRoleId: params.jobRoleId ?? null,
    roleTitle: role?.title ?? null,
    skillId: params.skillId ?? null,
    skillName: skill?.name ?? null,
    period,
    signalStrength,
    signalLabel,
    trendDirection,
    evidenceCount,
    sourceDiversity: sourceSet.size,
    sampleSize,
    uniqueEmployers,
    uniquePostings,
    proficiencyDistribution,
    confidence,
    confidenceLevel,
    convergence,
    sourceBreakdown,
    dataStatus: signals[0]?.dataStatus ?? "UNKNOWN",
    dataFreshness: signals[0]?.periodLabel ?? "UNKNOWN",
    lastRefreshed: new Date().toISOString(),
    methodology: "Weighted sum of evidence-source signals (weights documented as 'initial system configuration, subject to validation'). Signal strength scaled 0-100. Confidence = f(source diversity, sample size, employer coverage). Convergence = direction agreement across sources. Unique employer count is an approximation (sum across per-signal aggregates).",
  };
}

function sparseMarketIntelligence(params: NonNullable<Parameters<typeof getMarketIntelligence>[0]>, period: string): MarketIntelligenceObject {
  return {
    scope: params.districtId ? "DISTRICT" : params.clusterId ? "CLUSTER" : params.sectorId ? "SECTOR" : "STATE",
    geographyId: params.districtId ?? params.clusterId ?? null,
    geographyName: null,
    sectorId: params.sectorId ?? null,
    sectorName: null,
    jobRoleId: params.jobRoleId ?? null,
    roleTitle: null,
    skillId: params.skillId ?? null,
    skillName: null,
    period,
    signalStrength: 0,
    signalLabel: "NONE",
    trendDirection: "UNKNOWN",
    evidenceCount: 0,
    sourceDiversity: 0,
    sampleSize: 0,
    uniqueEmployers: 0,
    uniquePostings: 0,
    proficiencyDistribution: null,
    confidence: 0,
    confidenceLevel: "INSUFFICIENT",
    convergence: "INSUFFICIENT_DATA",
    sourceBreakdown: [],
    dataStatus: "UNKNOWN",
    dataFreshness: "UNKNOWN",
    lastRefreshed: new Date().toISOString(),
    methodology: "Insufficient evidence — no market signals computed for this scope/period.",
  };
}

function majorityDirection(dirs: SignalDirection[]): SignalDirection {
  if (dirs.length === 0) return "UNKNOWN";
  const counts: Record<string, number> = {};
  for (const d of dirs) counts[d] = (counts[d] ?? 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [top, count] = sorted[0];
  // If no clear majority (>50%), mark MIXED via convergence
  if (count / dirs.length < 0.5) return "UNKNOWN";
  return top as SignalDirection;
}

function computeConvergence(dirs: SignalDirection[]): ConvergenceStatus {
  if (dirs.length === 0) return "INSUFFICIENT_DATA";
  if (dirs.length < 2) return "LIMITED_EVIDENCE";
  const increasing = dirs.filter((d) => d === "INCREASING").length;
  const decreasing = dirs.filter((d) => d === "DECREASING").length;
  const stable = dirs.filter((d) => d === "STABLE").length;
  const max = Math.max(increasing, decreasing, stable);
  if (max === dirs.length) return "CONVERGING";
  if (increasing > 0 && decreasing > 0) return "MIXED";
  if (max / dirs.length >= 0.66) return "CONVERGING";
  return "MIXED";
}

function computeConfidence(args: { sourceDiversity: number; evidenceCount: number; sampleSize: number; uniqueEmployers: number }): number {
  // Diversity: 5 sources = full
  const diversityScore = Math.min(1, args.sourceDiversity / 5);
  // Sample size: 100+ = full
  const sampleScore = Math.min(1, args.sampleSize / 100);
  // Employer coverage: 20+ = full
  const employerScore = Math.min(1, args.uniqueEmployers / 20);
  // Weighted blend
  return Math.round((diversityScore * 0.4 + sampleScore * 0.35 + employerScore * 0.25) * 100) / 100;
}

async function getProficiencyDistribution(jobRoleId: string, skillId?: string | null): Promise<Record<string, number>> {
  const roleSkills = await db.roleSkill.findMany({
    where: { jobRoleId, ...(skillId ? { skillId } : {}) },
  });
  if (roleSkills.length === 0) return {};
  const dist: Record<string, number> = { AWARENESS: 0, WORKING: 0, PROFICIENT: 0, EXPERT: 0 };
  for (const rs of roleSkills) {
    const level = (rs.proficiencyLevel as keyof typeof dist) ?? "WORKING";
    if (level in dist) dist[level]++;
    else dist["WORKING"]++;
  }
  // Convert to percentages
  const total = roleSkills.length;
  const pct: Record<string, number> = {};
  for (const [k, v] of Object.entries(dist)) pct[k] = Math.round((v / total) * 100);
  return pct;
}

async function latestPeriod(): Promise<string | null> {
  const latest = await db.marketSignal.findFirst({ orderBy: { periodLabel: "desc" }, select: { periodLabel: true } });
  return latest?.periodLabel ?? null;
}

// ---------------------------------------------------------------------
// 4. Demand Snapshot persistence (aggregated by skill/role per period)
// ---------------------------------------------------------------------

export async function computeDemandSnapshots(period: string): Promise<{ snapshots: number }> {
  // Group MarketSignals by (scope, geographyId, sectorId, jobRoleId, skillId) for this period
  const signals = await db.marketSignal.findMany({ where: { periodLabel: period } });

  type Key = string;
  const groups = new Map<Key, {
    scope: string;
    geographyId: string;
    sectorId?: string;
    jobRoleId?: string;
    skillId?: string;
    signals: typeof signals;
  }>();

  for (const s of signals) {
    // For each signal, build snapshot at multiple granularities:
    // (a) skill-level (if skillId present)
    // (b) role-level (if jobRoleId present)
    if (s.skillId) {
      const key = `DISTRICT|${s.districtId ?? ""}|${s.sectorId ?? ""}||${s.skillId}`;
      const g = groups.get(key) ?? { scope: "DISTRICT", geographyId: s.districtId ?? "", sectorId: s.sectorId ?? undefined, skillId: s.skillId, signals: [] };
      g.signals.push(s);
      groups.set(key, g);
    }
    if (s.jobRoleId) {
      const key = `DISTRICT|${s.districtId ?? ""}|${s.sectorId ?? ""}|${s.jobRoleId}|`;
      const g = groups.get(key) ?? { scope: "DISTRICT", geographyId: s.districtId ?? "", sectorId: s.sectorId ?? undefined, jobRoleId: s.jobRoleId, signals: [] };
      g.signals.push(s);
      groups.set(key, g);
    }
  }

  let count = 0;
  for (const [, g] of groups) {
    const employers = new Set<string>();
    let evidenceCount = 0;
    let sampleSize = 0;
    const sourceSet = new Set<string>();
    const dirs: SignalDirection[] = [];
    let totalSignal = 0;
    for (const s of g.signals) {
      evidenceCount += s.sampleSize;
      sampleSize += s.signalValue;
      sourceSet.add(s.sourceType);
      dirs.push(s.direction as SignalDirection);
      totalSignal += s.signalValue;
      // We don't have employer set on MarketSignal aggregate here; use uniqueEmployers count
    }
    const signalStrength = Math.min(100, Math.round(totalSignal * 2));
    const trendDirection = majorityDirection(dirs);
    const confidence = computeConfidence({ sourceDiversity: sourceSet.size, evidenceCount, sampleSize, uniqueEmployers: 0 });
    const proficiencyDistribution = g.jobRoleId ? await getProficiencyDistribution(g.jobRoleId, g.skillId) : null;
    const dataStatus = g.signals[0]?.dataStatus ?? "UNKNOWN";

    // Resolve geography name
    let geographyName: string | null = null;
    if (g.geographyId) {
      const d = await db.district.findUnique({ where: { id: g.geographyId } });
      geographyName = d?.name ?? null;
    }

    // Upsert (delete existing for this period+scope to keep it simple — idempotent)
    await db.demandSnapshot.deleteMany({
      where: {
        scope: g.scope,
        geographyId: g.geographyId || null,
        sectorId: g.sectorId ?? null,
        jobRoleId: g.jobRoleId ?? null,
        skillId: g.skillId ?? null,
        period,
      },
    });
    await db.demandSnapshot.create({
      data: {
        scope: g.scope,
        geographyId: g.geographyId || null,
        geographyName,
        sectorId: g.sectorId ?? null,
        jobRoleId: g.jobRoleId ?? null,
        skillId: g.skillId ?? null,
        period,
        signalStrength,
        trendDirection,
        confidence,
        evidenceCount,
        sourceDiversity: sourceSet.size,
        sampleSize,
        uniqueEmployerCount: 0,
        uniquePostingCount: 0,
        proficiencyDistribution: proficiencyDistribution ? JSON.stringify(proficiencyDistribution) : null,
        dataStatus,
      },
    });
    count++;
  }

  return { snapshots: count };
}

// ---------------------------------------------------------------------
// 5. Emerging Skill Radar
// ---------------------------------------------------------------------

export interface EmergingSkillEntry {
  skillId: string;
  skillName: string;
  emergenceStatus: "EARLY_SIGNAL" | "EMERGING" | "ACCELERATING" | "INSUFFICIENT_EVIDENCE";
  signalStrength: number;
  recentActivity: number;
  trendVelocity: number;
  persistence: number;
  sourceDiversity: number;
  technologyLink: string | null;
  firstObserved: string | null;
  confidence: number;
  evidenceCount: number;
}

/**
 * Compute emerging-skill signals from MarketSignals across periods.
 * A skill qualifies as emerging when:
 *  - signal is increasing across periods
 *  - has recent activity (last period)
 *  - has technology-trend linkage
 *  - source diversity >= 2
 */
export async function computeEmergingSkills(): Promise<{ updated: number }> {
  // Get all skills
  const skills = await db.skill.findMany();
  let updated = 0;

  // Get distinct periods (sorted)
  const periods = await db.marketSignal.findMany({
    where: { skillId: { not: null } },
    select: { periodLabel: true },
    distinct: ["periodLabel"],
    orderBy: { periodLabel: "asc" },
  });
  const periodLabels = periods.map((p) => p.periodLabel);
  if (periodLabels.length === 0) return { updated: 0 };

  for (const skill of skills) {
    // Get signals for this skill across all periods
    const sigs = await db.marketSignal.findMany({
      where: { skillId: skill.id },
      orderBy: { periodLabel: "asc" },
    });
    if (sigs.length === 0) {
      await db.emergingSkillSignal.upsert({
        where: { skillId: skill.id },
        update: { emergenceStatus: "INSUFFICIENT_EVIDENCE", signalStrength: 0, evidenceCount: 0 },
        create: { skillId: skill.id, emergenceStatus: "INSUFFICIENT_EVIDENCE", signalStrength: 0, evidenceCount: 0 },
      });
      updated++;
      continue;
    }

    const totalEvidence = sigs.reduce((s, x) => s + x.sampleSize, 0);
    const sourceSet = new Set(sigs.map((s) => s.sourceType));
    const sourceDiversity = sourceSet.size;

    // Trend velocity: (last period signal - first period signal) / first period signal
    const first = sigs[0];
    const last = sigs[sigs.length - 1];
    const firstVal = first.signalValue;
    const lastVal = last.signalValue;
    const trendVelocity = firstVal > 0 ? Math.round(((lastVal - firstVal) / firstVal) * 100) / 100 : 0;

    // Recent activity: signal in the latest period
    const recentActivity = lastVal;

    // Persistence: fraction of periods with non-zero signal
    const persistence = sigs.filter((s) => s.signalValue > 0).length / sigs.length;

    // Technology linkage: check if skill is linked to a TechnologyTrend via SkillRelation
    const techLinks = await db.technologyTrend.findMany({
      where: { sectorName: { contains: skill.name } },
      take: 1,
    });
    // Also check skill relations for tech-trend-adjacent skills
    const techLinkName = techLinks[0]?.technology ?? null;

    // Signal strength (0-100)
    const signalStrength = Math.min(100, Math.round((recentActivity * 2 + (trendVelocity > 0 ? 20 : 0) + sourceDiversity * 5)));

    // Emergence status
    let emergenceStatus: "EARLY_SIGNAL" | "EMERGING" | "ACCELERATING" | "INSUFFICIENT_EVIDENCE" = "INSUFFICIENT_EVIDENCE";
    if (totalEvidence > 0 && sourceDiversity >= 1) {
      if (trendVelocity >= 0.5 && recentActivity >= 5) emergenceStatus = "ACCELERATING";
      else if (trendVelocity >= 0.2 && recentActivity >= 3) emergenceStatus = "EMERGING";
      else if (recentActivity >= 1) emergenceStatus = "EARLY_SIGNAL";
    }

    const confidence = computeConfidence({ sourceDiversity, evidenceCount: totalEvidence, sampleSize: recentActivity, uniqueEmployers: 0 });
    const firstObserved = first.periodStart;

    await db.emergingSkillSignal.upsert({
      where: { skillId: skill.id },
      update: {
        emergenceStatus,
        signalStrength,
        recentActivity,
        trendVelocity,
        persistence,
        sourceDiversity,
        technologyLink: techLinkName,
        firstObserved,
        confidence,
        evidenceCount: totalEvidence,
      },
      create: {
        skillId: skill.id,
        emergenceStatus,
        signalStrength,
        recentActivity,
        trendVelocity,
        persistence,
        sourceDiversity,
        technologyLink: techLinkName,
        firstObserved,
        confidence,
        evidenceCount: totalEvidence,
      },
    });
    updated++;
  }

  return { updated };
}

// ---------------------------------------------------------------------
// 6. Skill cross-sector presence
// ---------------------------------------------------------------------

export async function computeSkillSectorPresence(): Promise<{ updated: number }> {
  await db.skillSectorPresence.deleteMany({});
  // Group job-posting-derived MarketSignals by (skill, sector)
  const sigs = await db.marketSignal.findMany({
    where: { skillId: { not: null }, sectorId: { not: null }, sourceType: "JOB_POSTING" },
  });
  const map = new Map<string, { skillId: string; sectorId: string; strength: number; count: number }>();
  for (const s of sigs) {
    const key = `${s.skillId}|${s.sectorId}`;
    const ex = map.get(key) ?? { skillId: s.skillId!, sectorId: s.sectorId!, strength: 0, count: 0 };
    ex.strength += s.signalValue;
    ex.count += s.sampleSize;
    map.set(key, ex);
  }
  let count = 0;
  for (const [, v] of map) {
    await db.skillSectorPresence.create({
      data: {
        skillId: v.skillId,
        sectorId: v.sectorId,
        signalStrength: Math.min(100, v.strength * 2),
        evidenceCount: v.count,
        confidence: Math.min(1, v.count / 50),
      },
    });
    count++;
  }
  return { updated: count };
}

// ---------------------------------------------------------------------
// 7. Trend service — time-series retrieval
// ---------------------------------------------------------------------

export async function getTrendSeries(params: {
  skillId?: string;
  jobRoleId?: string;
  sectorId?: string;
  districtId?: string;
}): Promise<Array<{ period: string; signalValue: number; evidenceCount: number; direction: string }>> {
  const sigs = await db.marketSignal.findMany({
    where: {
      ...(params.skillId ? { skillId: params.skillId } : {}),
      ...(params.jobRoleId ? { jobRoleId: params.jobRoleId } : {}),
      ...(params.sectorId ? { sectorId: params.sectorId } : {}),
      ...(params.districtId ? { districtId: params.districtId } : {}),
    },
    orderBy: { periodLabel: "asc" },
    select: { periodLabel: true, signalValue: true, sampleSize: true, direction: true },
  });
  // Group by period
  const byPeriod = new Map<string, { signalValue: number; evidenceCount: number; directions: string[] }>();
  for (const s of sigs) {
    const ex = byPeriod.get(s.periodLabel) ?? { signalValue: 0, evidenceCount: 0, directions: [] };
    ex.signalValue += s.signalValue;
    ex.evidenceCount += s.sampleSize;
    ex.directions.push(s.direction);
    byPeriod.set(s.periodLabel, ex);
  }
  return [...byPeriod.entries()].map(([period, v]) => ({
    period,
    signalValue: v.signalValue,
    evidenceCount: v.evidenceCount,
    direction: majorityDirection(v.directions as SignalDirection[]),
  }));
}

// ---------------------------------------------------------------------
// 8. Evidence convergence
// ---------------------------------------------------------------------

export interface ConvergenceReport {
  jobPosting: { signal: number; direction: string };
  employerSurvey: { signal: number; direction: string };
  industryConsultation: { signal: number; direction: string };
  sectorGrowth: { signal: number; direction: string };
  technologyTrend: { signal: number; direction: string };
  placementOutcome: { signal: number; direction: string };
  overall: ConvergenceStatus;
  sourceDiversity: number;
  evidenceCount: number;
  uniqueEmployers: number;
  confidence: number;
}

export async function getEvidenceConvergence(params: {
  skillId?: string;
  jobRoleId?: string;
  sectorId?: string;
  districtId?: string;
  period?: string;
}): Promise<ConvergenceReport> {
  const period = params.period ?? await latestPeriod() ?? "UNKNOWN";
  const sigs = await db.marketSignal.findMany({
    where: {
      periodLabel: period,
      ...(params.skillId ? { skillId: params.skillId } : {}),
      ...(params.jobRoleId ? { jobRoleId: params.jobRoleId } : {}),
      ...(params.sectorId ? { sectorId: params.sectorId } : {}),
      ...(params.districtId ? { districtId: params.districtId } : {}),
    },
  });
  const get = (type: string) => {
    const s = sigs.filter((x) => x.sourceType === type);
    if (s.length === 0) return { signal: 0, direction: "UNKNOWN" };
    return {
      signal: s.reduce((a, b) => a + b.signalValue, 0),
      direction: majorityDirection(s.map((x) => x.direction as SignalDirection)),
    };
  };
  const dirs = sigs.map((s) => s.direction as SignalDirection);
  const employers = new Set<string>();
  let evidence = 0;
  for (const s of sigs) {
    evidence += s.sampleSize;
    // We don't have employer-level data in aggregate; use uniqueEmployers count
    void employers;
  }
  return {
    jobPosting: get("JOB_POSTING"),
    employerSurvey: get("EMPLOYER_SURVEY"),
    industryConsultation: get("INDUSTRY_CONSULTATION"),
    sectorGrowth: get("SECTOR_GROWTH"),
    technologyTrend: get("TECHNOLOGY_TREND"),
    placementOutcome: get("PLACEMENT_OUTCOME"),
    overall: computeConvergence(dirs),
    sourceDiversity: new Set(sigs.map((s) => s.sourceType)).size,
    evidenceCount: evidence,
    uniqueEmployers: sigs.reduce((s, x) => s + x.uniqueEmployers, 0),
    confidence: computeConfidence({
      sourceDiversity: new Set(sigs.map((s) => s.sourceType)).size,
      evidenceCount: evidence,
      sampleSize: sigs.reduce((s, x) => s + x.signalValue, 0),
      uniqueEmployers: sigs.reduce((s, x) => s + x.uniqueEmployers, 0),
    }),
  };
}
