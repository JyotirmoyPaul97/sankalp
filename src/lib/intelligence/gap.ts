/**
 * KAUSHAL DRISHTI — Phase 5 Part 2 Gap Engine
 * ---------------------------------------------------------------------
 * Connects Phase 4 market demand + Phase 5 Part 1 training supply →
 * Demand–Supply Gap Intelligence.
 *
 * The comparison is NOT simplistic subtraction (demand_count - supply_count).
 * It normalizes both sides into comparable indices (0-100) using transparent
 * configurable rules, then classifies the gap across multiple dimensions:
 *   - coverageStatus: WELL_COVERED | PARTIALLY_COVERED | LIMITED_COVERAGE | NO_IDENTIFIED_SUPPLY | INSUFFICIENT_DATA
 *   - proficiencyStatus: ALIGNED | LOWER_THAN_MARKET | HIGHER_THAN_MARKET | MIXED | UNKNOWN | INSUFFICIENT_DATA
 *   - capacityStatus: ADEQUATE | LIMITED | WEAK | NO_CAPACITY | UNKNOWN
 *   - geographicStatus: LOCAL | NEARBY | REGIONAL | OUTSIDE_TARGET_GEOGRAPHY | UNKNOWN
 *   - gapSignal: LOW_GAP | MODERATE_GAP | HIGH_GAP | SUPPLY_PRESENT | SUPPLY_LIMITED | NO_IDENTIFIED_SUPPLY | PROFICIENCY_MISMATCH | GEOGRAPHIC_GAP | INSUFFICIENT_DATA
 *
 * NO recommendations. NO policy. OBSERVATION + LIMITED INTERPRETATION only.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------
// 1. Gap signal computation
// ---------------------------------------------------------------------

export interface GapComputeOptions {
  period: string;
}

/**
 * Compute demand–supply gap signals for a given period.
 * For each (district?, sector?, role?, skill?) combination, fetches the
 * Phase 4 market signal + Phase 5 training supply signal, normalizes both
 * to 0-100 indices, and upserts a DemandSupplyGapSignal row.
 *
 * Historical periods are preserved (never overwritten — uses @@unique).
 */
export async function computeGapSignals(opts: GapComputeOptions): Promise<{ gapsCreated: number }> {
  // Wipe existing gaps for this period (idempotent recompute)
  await db.demandSupplyGapSignal.deleteMany({ where: { period: opts.period } });

  // Load all market signals for this period (grouped by skill + district)
  const marketSignals = await db.marketSignal.findMany({
    where: { periodLabel: opts.period, skillId: { not: null } },
    include: { skill: true, jobRole: true, district: true, sector: true },
  });
  // Load all training supply signals for this period
  const trainingSignals = await db.trainingSupplySignal.findMany({
    where: { periodLabel: opts.period },
    include: { course: { include: { sector: true } }, skill: true, jobRole: true, district: true },
  });

  // Group training signals by (skillId, districtId) for matching
  const trainingBySkill = new Map<string, typeof trainingSignals>();
  for (const ts of trainingSignals) {
    if (!ts.skillId) continue;
    const key = `${ts.skillId}|${ts.districtId ?? ""}`;
    const arr = trainingBySkill.get(key) ?? [];
    arr.push(ts);
    trainingBySkill.set(key, arr);
  }
  // Also group by skillId alone (for statewide supply)
  const trainingBySkillStatewide = new Map<string, typeof trainingSignals>();
  for (const ts of trainingSignals) {
    if (!ts.skillId) continue;
    const arr = trainingBySkillStatewide.get(ts.skillId) ?? [];
    arr.push(ts);
    trainingBySkillStatewide.set(ts.skillId, arr);
  }

  let count = 0;

  // Process each market signal (skill-level)
  const processedKeys = new Set<string>();
  for (const ms of marketSignals) {
    if (!ms.skillId) continue;
    const key = `${ms.districtId ?? ""}|${ms.skillId}`;
    if (processedKeys.has(key)) continue;
    processedKeys.add(key);

    // Aggregate market demand for this (district, skill)
    const matchingMarket = marketSignals.filter((m) => m.districtId === ms.districtId && m.skillId === ms.skillId);
    const marketDemandStrength = Math.min(100, matchingMarket.reduce((s, m) => s + m.signalValue, 0) * 2);
    const marketDemandSignal = strengthToLabel(marketDemandStrength);
    const marketEvidence = matchingMarket.reduce((s, m) => s + m.sampleSize, 0);
    const uniqueEmployers = matchingMarket.reduce((s, m) => s + m.uniqueEmployers, 0);
    const marketConfidence = Math.min(1, (marketEvidence / 50) * 0.7 + (uniqueEmployers / 20) * 0.3);

    // Match training supply: local (same district) first, then statewide
    const localTraining = trainingBySkill.get(`${ms.skillId}|${ms.districtId ?? ""}`) ?? [];
    const statewideTraining = trainingBySkillStatewide.get(ms.skillId) ?? [];
    const hasLocalSupply = localTraining.length > 0;
    const hasAnySupply = statewideTraining.length > 0;

    // Training supply aggregation
    const trainingSupply = localTraining.length > 0 ? localTraining : statewideTraining;
    const plannedCapacity = trainingSupply.reduce((s, t) => s + t.plannedCapacity, 0);
    const enrolled = trainingSupply.reduce((s, t) => s + (t.enrolledCount ?? 0), 0);
    const completed = trainingSupply.reduce((s, t) => s + (t.completedCount ?? 0), 0);
    const certified = trainingSupply.reduce((s, t) => s + (t.certifiedCount ?? 0), 0);
    const courseSet = new Set(trainingSupply.map((t) => t.courseId).filter(Boolean));
    const instSet = new Set(trainingSupply.map((t) => t.institutionId).filter(Boolean));
    const centreSet = new Set(trainingSupply.map((t) => t.trainingCentreId).filter(Boolean));

    const trainingSupplyStrength = Math.min(100, plannedCapacity / 10); // 1000+ seats = 100
    const trainingSupplySignal = strengthToLabel(trainingSupplyStrength);
    const trainingConfidence = Math.min(1, (courseSet.size / 5) * 0.4 + (instSet.size / 5) * 0.3 + (enrolled > 0 ? 0.3 : 0));

    // Required proficiency from RoleSkill (market side)
    const roleSkills = ms.jobRoleId ? await db.roleSkill.findMany({ where: { jobRoleId: ms.jobRoleId, skillId: ms.skillId } }) : [];
    const requiredProficiency = roleSkills[0]?.proficiencyLevel ?? null;

    // Training proficiency from CourseSkill
    const courseSkills = await db.courseSkill.findMany({
      where: { skillId: ms.skillId },
      select: { expectedProficiency: true },
    });
    const trainingProficiencies = courseSkills.map((cs) => cs.expectedProficiency).filter(Boolean) as string[];
    const trainingProficiency = trainingProficiencies.length > 0 ? mostCommon(trainingProficiencies) : null;

    // Normalize to indices (0-100)
    const demandIndex = marketDemandStrength;
    const supplyIndex = trainingSupplyStrength;

    // Coverage status
    const coverageStatus = computeCoverageStatus(courseSet.size, hasLocalSupply, hasAnySupply, marketEvidence);

    // Proficiency status
    const proficiencyStatus = computeProficiencyStatus(requiredProficiency, trainingProficiency);

    // Capacity status
    const capacityStatus = computeCapacityStatus(plannedCapacity, enrolled, marketDemandStrength);

    // Geographic status
    const geographicStatus = hasLocalSupply ? "LOCAL" : hasAnySupply ? "REGIONAL" : "UNKNOWN";

    // Gap signal
    const { gapSignal, gapType, gapScore } = computeGapSignal({
      marketDemandSignal,
      trainingSupplySignal,
      coverageStatus,
      proficiencyStatus,
      capacityStatus,
      geographicStatus,
      demandIndex,
      supplyIndex,
    });

    // Gap confidence — weakest critical dimension
    const gapConfidence = computeGapConfidence(marketConfidence, trainingConfidence, coverageStatus);
    const confidenceLevel = confidenceToLevel(gapConfidence);

    await db.demandSupplyGapSignal.create({
      data: {
        districtId: ms.districtId,
        clusterId: null,
        sectorId: ms.sectorId,
        jobRoleId: ms.jobRoleId,
        skillId: ms.skillId,
        period: opts.period,
        marketDemandSignal,
        marketDemandStrength,
        trainingSupplySignal,
        trainingSupplyStrength,
        demandIndex,
        supplyIndex,
        coverageStatus,
        proficiencyStatus,
        capacityStatus,
        geographicStatus,
        gapSignal,
        gapType,
        gapScore,
        confidence: gapConfidence,
        confidenceLevel,
        marketEvidenceCount: marketEvidence,
        trainingEvidenceCount: trainingSupply.length,
        sourceDiversity: new Set(matchingMarket.map((m) => m.sourceType)).size,
        uniqueEmployers,
        trendDirection: matchingMarket[0]?.direction ?? "UNKNOWN",
        requiredProficiency,
        trainingProficiency,
        plannedCapacity,
        enrolledCount: enrolled || null,
        completedCount: completed || null,
        certifiedCount: certified || null,
        courseCount: courseSet.size,
        institutionCount: instSet.size,
        centreCount: centreSet.size,
        dataStatus: ms.dataStatus,
      },
    });
    count++;
  }

  // Also compute role-level gaps (when jobRoleId is present but skillId is null in market signals)
  // For each role, aggregate across all skills
  const roleMarketSignals = await db.marketSignal.findMany({
    where: { periodLabel: opts.period, jobRoleId: { not: null } },
    include: { jobRole: true, district: true },
  });
  const roleGroups = new Map<string, typeof roleMarketSignals>();
  for (const ms of roleMarketSignals) {
    if (!ms.jobRoleId) continue;
    const key = `${ms.districtId ?? ""}|${ms.jobRoleId}`;
    const arr = roleGroups.get(key) ?? [];
    arr.push(ms);
    roleGroups.set(key, arr);
  }

  for (const [key, signals] of roleGroups) {
    const [districtId, jobRoleId] = key.split("|");
    // Check if we already have a gap signal for this role (skillId=null)
    const existing = await db.demandSupplyGapSignal.findFirst({
      where: { districtId: districtId || null, jobRoleId, skillId: null, period: opts.period },
    });
    if (existing) continue;

    const marketDemandStrength = Math.min(100, signals.reduce((s, m) => s + m.signalValue, 0) * 2);
    const marketDemandSignal = strengthToLabel(marketDemandStrength);
    const marketEvidence = signals.reduce((s, m) => s + m.sampleSize, 0);
    const uniqueEmployers = signals.reduce((s, m) => s + m.uniqueEmployers, 0);

    // Find training supply for this role
    const roleTraining = await db.trainingSupplySignal.findMany({
      where: { periodLabel: opts.period, jobRoleId, ...(districtId ? { districtId } : {}) },
    });
    const plannedCapacity = roleTraining.reduce((s, t) => s + t.plannedCapacity, 0);
    const enrolled = roleTraining.reduce((s, t) => s + (t.enrolledCount ?? 0), 0);
    const completed = roleTraining.reduce((s, t) => s + (t.completedCount ?? 0), 0);
    const courseSet = new Set(roleTraining.map((t) => t.courseId).filter(Boolean));
    const instSet = new Set(roleTraining.map((t) => t.institutionId).filter(Boolean));
    const centreSet = new Set(roleTraining.map((t) => t.trainingCentreId).filter(Boolean));
    const trainingSupplyStrength = Math.min(100, plannedCapacity / 10);
    const trainingSupplySignal = strengthToLabel(trainingSupplyStrength);

    const coverageStatus = computeCoverageStatus(courseSet.size, roleTraining.length > 0, roleTraining.length > 0, marketEvidence);
    const capacityStatus = computeCapacityStatus(plannedCapacity, enrolled, marketDemandStrength);
    const geographicStatus = roleTraining.length > 0 ? "LOCAL" : "UNKNOWN";
    const { gapSignal, gapType, gapScore } = computeGapSignal({
      marketDemandSignal, trainingSupplySignal, coverageStatus,
      proficiencyStatus: "UNKNOWN", capacityStatus, geographicStatus,
      demandIndex: marketDemandStrength, supplyIndex: trainingSupplyStrength,
    });
    const gapConfidence = computeGapConfidence(
      Math.min(1, marketEvidence / 50),
      Math.min(1, courseSet.size / 5),
      coverageStatus,
    );

    await db.demandSupplyGapSignal.create({
      data: {
        districtId: districtId || null,
        jobRoleId,
        period: opts.period,
        marketDemandSignal, marketDemandStrength,
        trainingSupplySignal, trainingSupplyStrength,
        demandIndex: marketDemandStrength, supplyIndex: trainingSupplyStrength,
        coverageStatus, proficiencyStatus: "UNKNOWN", capacityStatus, geographicStatus,
        gapSignal, gapType, gapScore,
        confidence: gapConfidence, confidenceLevel: confidenceToLevel(gapConfidence),
        marketEvidenceCount: marketEvidence, trainingEvidenceCount: roleTraining.length,
        sourceDiversity: new Set(signals.map((s) => s.sourceType)).size,
        uniqueEmployers,
        trendDirection: signals[0]?.direction ?? "UNKNOWN",
        plannedCapacity, enrolledCount: enrolled || null, completedCount: completed || null,
        courseCount: courseSet.size, institutionCount: instSet.size, centreCount: centreSet.size,
        dataStatus: signals[0]?.dataStatus ?? "UNKNOWN",
      },
    });
    count++;
  }

  return { gapsCreated: count };
}

// ---------------------------------------------------------------------
// 2. Classification helpers
// ---------------------------------------------------------------------

function strengthToLabel(strength: number): "NONE" | "LOW" | "MEDIUM" | "HIGH" {
  if (strength >= 70) return "HIGH";
  if (strength >= 35) return "MEDIUM";
  if (strength > 0) return "LOW";
  return "NONE";
}

function computeCoverageStatus(courseCount: number, hasLocal: boolean, hasAny: boolean, marketEvidence: number): string {
  if (marketEvidence === 0 && courseCount === 0) return "INSUFFICIENT_DATA";
  if (courseCount === 0) return "NO_IDENTIFIED_SUPPLY";
  if (courseCount >= 5 && hasLocal) return "WELL_COVERED";
  if (courseCount >= 2) return "PARTIALLY_COVERED";
  return "LIMITED_COVERAGE";
}

const PROFICIENCY_RANK: Record<string, number> = { AWARENESS: 1, WORKING: 2, PROFICIENT: 3, EXPERT: 4 };

function computeProficiencyStatus(required: string | null, training: string | null): string {
  if (!required && !training) return "INSUFFICIENT_DATA";
  if (!required || !training) return "UNKNOWN";
  const reqRank = PROFICIENCY_RANK[required] ?? 0;
  const trainRank = PROFICIENCY_RANK[training] ?? 0;
  if (reqRank === 0 || trainRank === 0) return "UNKNOWN";
  if (trainRank === reqRank) return "ALIGNED";
  if (trainRank < reqRank) return "LOWER_THAN_MARKET";
  return "HIGHER_THAN_MARKET";
}

function computeCapacityStatus(plannedCapacity: number, enrolled: number, marketDemand: number): string {
  if (plannedCapacity === 0 && marketDemand > 0) return "NO_CAPACITY";
  if (plannedCapacity === 0) return "UNKNOWN";
  // If demand is HIGH and capacity < 200, it's limited
  if (marketDemand >= 70 && plannedCapacity < 200) return "LIMITED";
  if (marketDemand >= 70 && plannedCapacity < 100) return "WEAK";
  if (marketDemand >= 35 && plannedCapacity < 100) return "LIMITED";
  return "ADEQUATE";
}

function computeGapSignal(args: {
  marketDemandSignal: string;
  trainingSupplySignal: string;
  coverageStatus: string;
  proficiencyStatus: string;
  capacityStatus: string;
  geographicStatus: string;
  demandIndex: number;
  supplyIndex: number;
}): { gapSignal: string; gapType: string | null; gapScore: number } {
  const { marketDemandSignal, trainingSupplySignal, coverageStatus, proficiencyStatus, capacityStatus, geographicStatus, demandIndex, supplyIndex } = args;

  // If insufficient data on either side
  if (coverageStatus === "INSUFFICIENT_DATA") {
    return { gapSignal: "INSUFFICIENT_DATA", gapType: null, gapScore: 0 };
  }
  if (coverageStatus === "NO_IDENTIFIED_SUPPLY" && marketDemandSignal !== "NONE") {
    return { gapSignal: "NO_IDENTIFIED_SUPPLY", gapType: "TRAINING_COVERAGE_GAP", gapScore: Math.min(100, demandIndex) };
  }
  // Proficiency mismatch
  if (proficiencyStatus === "LOWER_THAN_MARKET" && marketDemandSignal !== "NONE") {
    const score = Math.min(100, demandIndex * 0.6 + 30);
    return { gapSignal: "PROFICIENCY_MISMATCH", gapType: "PROFICIENCY_GAP", gapScore: score };
  }
  // Geographic gap (supply exists but not locally)
  if (geographicStatus === "REGIONAL" && marketDemandSignal !== "NONE" && trainingSupplySignal !== "NONE") {
    return { gapSignal: "GEOGRAPHIC_GAP", gapType: "GEOGRAPHIC_GAP", gapScore: Math.min(100, demandIndex * 0.5) };
  }
  // Capacity gap
  if ((capacityStatus === "LIMITED" || capacityStatus === "WEAK") && marketDemandSignal !== "NONE") {
    const score = Math.min(100, demandIndex * 0.7 + (capacityStatus === "WEAK" ? 20 : 10));
    return { gapSignal: "MODERATE_GAP", gapType: "CAPACITY_GAP", gapScore: score };
  }
  // High gap: high demand + low supply
  if ((marketDemandSignal === "HIGH" || marketDemandSignal === "MEDIUM") && (trainingSupplySignal === "NONE" || trainingSupplySignal === "LOW")) {
    const score = Math.min(100, demandIndex * 0.8);
    return { gapSignal: "HIGH_GAP", gapType: "MARKET_GAP", gapScore: score };
  }
  // Supply present
  if (trainingSupplySignal === "HIGH" || trainingSupplySignal === "MEDIUM") {
    return { gapSignal: "SUPPLY_PRESENT", gapType: null, gapScore: Math.max(0, supplyIndex - demandIndex) };
  }
  // Low gap
  if (marketDemandSignal === "LOW" || marketDemandSignal === "NONE") {
    return { gapSignal: "LOW_GAP", gapType: null, gapScore: 0 };
  }
  // Supply limited
  if (trainingSupplySignal === "LOW" && marketDemandSignal !== "NONE") {
    return { gapSignal: "SUPPLY_LIMITED", gapType: "CAPACITY_GAP", gapScore: Math.min(100, demandIndex * 0.4) };
  }
  return { gapSignal: "INSUFFICIENT_DATA", gapType: null, gapScore: 0 };
}

function computeGapConfidence(marketConf: number, trainingConf: number, coverageStatus: string): number {
  // Gap confidence = weakest critical dimension
  if (coverageStatus === "NO_IDENTIFIED_SUPPLY" || coverageStatus === "INSUFFICIENT_DATA") {
    return Math.min(marketConf, 0.3); // cap at LOW if training evidence is missing
  }
  return Math.min(marketConf, trainingConf);
}

function confidenceToLevel(score: number): "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT" {
  if (score >= 0.7) return "HIGH";
  if (score >= 0.4) return "MEDIUM";
  if (score > 0) return "LOW";
  return "INSUFFICIENT";
}

function mostCommon<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  for (const x of arr) counts.set(x, (counts.get(x) ?? 0) + 1);
  let max = arr[0];
  let maxCount = 0;
  for (const [x, c] of counts) {
    if (c > maxCount) { max = x; maxCount = c; }
  }
  return max;
}

// ---------------------------------------------------------------------
// 3. Gap retrieval APIs
// ---------------------------------------------------------------------

export async function getGapsBySkill(params: { districtId?: string; sectorId?: string; period?: string }) {
  const period = params.period ?? (await latestGapPeriod()) ?? "UNKNOWN";
  if (period === "UNKNOWN") return [];
  const gaps = await db.demandSupplyGapSignal.findMany({
    where: {
      period,
      skillId: { not: null },
      ...(params.districtId ? { districtId: params.districtId } : {}),
      ...(params.sectorId ? { sectorId: params.sectorId } : {}),
    },
    include: { skill: true, district: true, sector: true },
    orderBy: { gapScore: "desc" },
  });
  return gaps;
}

export async function getGapsByRole(params: { districtId?: string; sectorId?: string; period?: string }) {
  const period = params.period ?? (await latestGapPeriod()) ?? "UNKNOWN";
  if (period === "UNKNOWN") return [];
  const gaps = await db.demandSupplyGapSignal.findMany({
    where: {
      period,
      jobRoleId: { not: null },
      skillId: null,
      ...(params.districtId ? { districtId: params.districtId } : {}),
      ...(params.sectorId ? { sectorId: params.sectorId } : {}),
    },
    include: { jobRole: true, district: true, sector: true },
    orderBy: { gapScore: "desc" },
  });
  return gaps;
}

export async function getGapMatrix(params: { districtId?: string; sectorId?: string; period?: string }) {
  const period = params.period ?? (await latestGapPeriod()) ?? "UNKNOWN";
  if (period === "UNKNOWN") return [];
  const gaps = await db.demandSupplyGapSignal.findMany({
    where: {
      period,
      jobRoleId: { not: null },
      skillId: null,
      ...(params.districtId ? { districtId: params.districtId } : {}),
      ...(params.sectorId ? { sectorId: params.sectorId } : {}),
    },
    include: { jobRole: true },
    orderBy: { gapScore: "desc" },
  });
  return gaps.map((g) => ({
    role: g.jobRole?.title ?? "—",
    demand: g.marketDemandSignal,
    supply: g.trainingSupplySignal,
    coverage: g.coverageStatus,
    proficiency: g.proficiencyStatus,
    gapSignal: g.gapSignal,
    gapScore: g.gapScore,
    confidence: g.confidenceLevel,
  }));
}

export async function getGapExplanation(gapId: string) {
  const gap = await db.demandSupplyGapSignal.findUnique({
    where: { id: gapId },
    include: { skill: true, jobRole: true, district: true, sector: true },
  });
  if (!gap) return null;

  const reasons: string[] = [];
  if (gap.marketDemandSignal === "HIGH") reasons.push(`Market demand signal is HIGH (strength ${Math.round(gap.marketDemandStrength)}/100).`);
  if (gap.marketDemandSignal === "MEDIUM") reasons.push(`Market demand signal is MEDIUM (strength ${Math.round(gap.marketDemandStrength)}/100).`);
  if (gap.uniqueEmployers > 0) reasons.push(`${gap.uniqueEmployers} unique employers are creating this demand signal.`);
  if (gap.trendDirection === "INCREASING") reasons.push("Market trend is INCREASING.");
  if (gap.courseCount > 0) reasons.push(`${gap.courseCount} relevant training courses identified.`);
  if (gap.courseCount === 0) reasons.push("No relevant training courses identified in this scope.");
  if (gap.plannedCapacity > 0) reasons.push(`Planned training capacity: ${gap.plannedCapacity} seats.`);
  if (gap.capacityStatus === "LIMITED" || gap.capacityStatus === "WEAK") reasons.push(`Training capacity is ${gap.capacityStatus.toLowerCase()}.`);
  if (gap.proficiencyStatus === "LOWER_THAN_MARKET") reasons.push(`Market requires ${gap.requiredProficiency ?? "higher"} proficiency but training mostly covers ${gap.trainingProficiency ?? "lower"}.`);
  if (gap.geographicStatus === "REGIONAL") reasons.push("Training supply exists regionally but not in the target district.");
  if (gap.confidenceLevel === "MEDIUM") reasons.push("Confidence is MEDIUM because training evidence is incomplete.");
  if (gap.confidenceLevel === "LOW") reasons.push("Confidence is LOW — insufficient evidence on one or both sides.");
  if (reasons.length === 0) reasons.push("Gap classification is based on the aggregated demand and supply signals.");

  return {
    gap,
    reasons,
    methodology: "Gap signal computed from transparent rules comparing Phase 4 market demand (normalized 0-100) with Phase 5 training supply (normalized 0-100). Dimensions kept separate: coverage, proficiency, capacity, geographic. Weights documented as 'initial system configuration — subject to validation.' No workforce-unit estimation.",
  };
}

async function latestGapPeriod(): Promise<string | null> {
  const latest = await db.demandSupplyGapSignal.findFirst({ orderBy: { period: "desc" }, select: { period: true } });
  return latest?.period ?? null;
}
