/**
 * KAUSHAL DRISHTI — Phase 8 Digital Twin + Policy Sandbox + Outcome Engine
 * ---------------------------------------------------------------------
 * District skill digital twin: current-state representation using existing
 * system data. Policy sandbox: transparent scenario simulation. Outcome
 * feedback loop: implementation tracking + pre/post comparison.
 *
 * NO black-box AI. NO automatic policy selection. NO fabricated outcomes.
 * OBSERVED vs ASSUMED vs MODELLED vs SIMULATED always distinguished.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------
// 1. District Digital Twin — current state snapshot
// ---------------------------------------------------------------------

export async function buildDistrictTwin(districtId: string): Promise<{ twin: Record<string, unknown> }> {
  const district = await db.district.findUnique({ where: { id: districtId }, include: { division: true } });
  if (!district) return { twin: {} };

  // Market state: top demand signals
  const marketSignals = await db.marketSignal.findMany({
    where: { districtId },
    include: { skill: true, jobRole: true, sector: true },
  });
  const skillMap = new Map<string, number>();
  const roleMap = new Map<string, number>();
  for (const s of marketSignals) {
    if (s.skill) skillMap.set(s.skill.name, (skillMap.get(s.skill.name) ?? 0) + s.signalValue);
    if (s.jobRole) roleMap.set(s.jobRole.title, (roleMap.get(s.jobRole.title) ?? 0) + s.signalValue);
  }
  const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, v]) => ({ name, signal: v }));

  // Emerging skills
  const emerging = await db.emergingSkillSignal.findMany({ include: { skill: true }, where: { emergenceStatus: { in: ["EARLY_SIGNAL", "EMERGING", "ACCELERATING"] } } });

  // Training state
  const institutions = await db.institution.count({ where: { districtId } });
  const centres = await db.trainingCentre.count({ where: { districtId } });
  const offerings = await db.courseOffering.findMany({
    where: { trainingCentre: { districtId } },
    select: { plannedSeats: true, enrolledCount: true, completedCount: true, certifiedCount: true },
  });
  const plannedCapacity = offerings.reduce((s, o) => s + o.plannedSeats, 0);
  const enrolled = offerings.reduce((s, o) => s + (o.enrolledCount ?? 0), 0);
  const completed = offerings.reduce((s, o) => s + (o.completedCount ?? 0), 0);
  const certified = offerings.reduce((s, o) => s + (o.certifiedCount ?? 0), 0);

  // Capability state
  const deliveryGaps = await db.deliveryCapabilityGap.findMany({
    where: { trainingCentre: { districtId } },
    select: { overallCapabilityStatus: true },
  });
  const ready = deliveryGaps.filter((g) => g.overallCapabilityStatus === "COURSE_DELIVERY_READY").length;
  const partiallyReady = deliveryGaps.filter((g) => g.overallCapabilityStatus === "PARTIALLY_READY").length;
  const limited = deliveryGaps.filter((g) => g.overallCapabilityStatus === "LIMITED_READINESS").length;

  // Gap state
  const gaps = await db.demandSupplyGapSignal.findMany({
    where: { districtId },
    select: { gapSignal: true, gapScore: true },
  });
  const highGaps = gaps.filter((g) => g.gapSignal === "HIGH_GAP").length;
  const moderateGaps = gaps.filter((g) => g.gapSignal === "MODERATE_GAP").length;
  const profMismatches = gaps.filter((g) => g.gapSignal === "PROFICIENCY_MISMATCH").length;
  const covered = gaps.filter((g) => g.gapSignal === "SUPPLY_PRESENT" || g.gapSignal === "LOW_GAP").length;

  // Candidate state
  const candidates = await db.candidate.count({ where: { currentDistrictId: districtId } });
  const candidateReadiness = await db.candidateRoleReadiness.findMany({
    where: { candidate: { currentDistrictId: districtId } },
    select: { overallReadinessSignal: true },
  });
  const highReadiness = candidateReadiness.filter((r) => r.overallReadinessSignal === "HIGH_READINESS").length;
  const moderateReadiness = candidateReadiness.filter((r) => r.overallReadinessSignal === "MODERATE_READINESS").length;
  const developing = candidateReadiness.filter((r) => r.overallReadinessSignal === "DEVELOPING").length;

  // Outcome state
  const placements = await db.placementOutcome.count({ where: { districtId } });
  const sectorGrowth = await db.sectorGrowth.findMany({ where: { OR: [{ geography: district.name }, { geography: "Maharashtra" }] } });

  // Overall confidence
  const marketConf = marketSignals.length > 0 ? 0.7 : 0.3;
  const trainingConf = offerings.length > 0 ? 0.7 : 0.3;
  const candidateConf = candidates > 0 ? 0.6 : 0.3;
  const overallConfidence = Math.round(((marketConf + trainingConf + candidateConf) / 3) * 100) / 100;

  const twin = {
    district: { id: district.id, name: district.name, division: district.division?.name ?? null },
    observationPeriod: "2026-09",
    market: {
      topSkills: top(skillMap, 5),
      topRoles: top(roleMap, 5),
      emergingSkills: emerging.slice(0, 5).map((e) => ({ name: e.skill.name, status: e.emergenceStatus })),
      sectorGrowth: sectorGrowth.slice(0, 3).map((s) => ({ sector: s.sectorName, growth: s.growthRatePct })),
    },
    training: {
      institutions, centres,
      plannedCapacity, enrolled, completed, certified,
      courseOfferings: offerings.length,
    },
    capability: {
      readyCourses: ready,
      partiallyReadyCourses: partiallyReady,
      limitedReadinessCourses: limited,
      totalDeliveryGaps: deliveryGaps.length,
    },
    gaps: {
      highGapCount: highGaps,
      moderateGapCount: moderateGaps,
      proficiencyMismatchCount: profMismatches,
      coveredCount: covered,
      totalGaps: gaps.length,
    },
    candidates: {
      totalCandidates: candidates,
      highReadiness, moderateReadiness, developing,
    },
    outcomes: {
      placementRecords: placements,
    },
    confidence: overallConfidence,
    freshness: "2026-09",
    dataStatus: "SYNTHETIC",
  };

  // Upsert twin
  await db.districtSkillTwin.upsert({
    where: { districtId },
    update: {
      observationPeriod: "2026-09",
      marketStateSnapshot: JSON.stringify(twin.market),
      trainingStateSnapshot: JSON.stringify(twin.training),
      capabilityStateSnapshot: JSON.stringify(twin.capability),
      candidateStateSnapshot: JSON.stringify(twin.candidates),
      outcomeStateSnapshot: JSON.stringify(twin.outcomes),
      overallDataConfidence: overallConfidence,
    },
    create: {
      districtId,
      observationPeriod: "2026-09",
      marketStateSnapshot: JSON.stringify(twin.market),
      trainingStateSnapshot: JSON.stringify(twin.training),
      capabilityStateSnapshot: JSON.stringify(twin.capability),
      candidateStateSnapshot: JSON.stringify(twin.candidates),
      outcomeStateSnapshot: JSON.stringify(twin.outcomes),
      overallDataConfidence: overallConfidence,
    },
  });

  return { twin };
}

// ---------------------------------------------------------------------
// 2. Baseline creation (immutable)
// ---------------------------------------------------------------------

export async function createBaseline(districtId: string, period: string): Promise<{ baselineId: string }> {
  const { twin } = await buildDistrictTwin(districtId);
  const baseline = await db.districtBaseline.create({
    data: {
      districtId,
      observationPeriod: period,
      marketSnapshot: JSON.stringify(twin.market),
      trainingSnapshot: JSON.stringify(twin.training),
      capabilitySnapshot: JSON.stringify(twin.capability),
      candidateSnapshot: JSON.stringify(twin.candidates),
      outcomeSnapshot: JSON.stringify(twin.outcomes),
      dataStatus: "SYNTHETIC",
    },
  });
  return { baselineId: baseline.id };
}

// ---------------------------------------------------------------------
// 3. Scenario simulation (transparent rules, no black box)
// ---------------------------------------------------------------------

export async function simulateScenario(scenarioId: string): Promise<{ results: number }> {
  const scenario = await db.policyScenario.findUnique({
    where: { id: scenarioId },
    include: {
      interventions: { include: { interventionType: true } },
      assumptions: true,
      baseline: true,
    },
  });
  if (!scenario) throw new Error("Scenario not found");

  // Delete previous results (idempotent recompute)
  await db.scenarioImpactResult.deleteMany({ where: { scenarioId } });

  const baseline = scenario.baseline;
  if (!baseline) throw new Error("No baseline for this scenario");

  const baselineData = {
    market: JSON.parse(baseline.marketSnapshot ?? "{}"),
    training: JSON.parse(baseline.trainingSnapshot ?? "{}"),
    capability: JSON.parse(baseline.capabilitySnapshot ?? "{}"),
    gaps: JSON.parse(baseline.candidateSnapshot ?? "{}"),
  };

  let resultsCreated = 0;

  for (const iv of scenario.interventions) {
    const type = iv.interventionType.code;

    // Training capacity change
    if (iv.capacityChange && iv.capacityChange !== 0) {
      const baseCapacity = (baselineData.training as { plannedCapacity?: number }).plannedCapacity ?? 0;
      const simulatedCapacity = baseCapacity + iv.capacityChange;

      await db.scenarioImpactResult.create({
        data: {
          scenarioId,
          targetDimension: "TRAINING_CAPACITY",
          targetId: iv.targetCourseId ?? iv.targetSkillId ?? null,
          baselineValue: String(baseCapacity),
          simulatedValue: String(simulatedCapacity),
          delta: `${iv.capacityChange > 0 ? "+" : ""}${iv.capacityChange}`,
          metric: "planned_seats",
          unit: "seats",
          confidence: 0.6,
          assumptionCount: scenario.assumptions.length,
          dataStatus: "SIMULATED",
        },
      });
      resultsCreated++;

      // Gap signal change (heuristic: more capacity → lower gap)
      const baseHighGaps = (baselineData.gaps as { highGapCount?: number }).highGapCount ?? 0;
      const simulatedHighGaps = Math.max(0, baseHighGaps - Math.floor(iv.capacityChange / 100));
      await db.scenarioImpactResult.create({
        data: {
          scenarioId,
          targetDimension: "GAP_SIGNAL",
          baselineValue: `${baseHighGaps} high gaps`,
          simulatedValue: `${simulatedHighGaps} high gaps`,
          delta: `${simulatedHighGaps - baseHighGaps}`,
          metric: "high_gap_count",
          unit: "count",
          confidence: 0.4,
          assumptionCount: scenario.assumptions.length,
          dataStatus: "SIMULATED",
        },
      });
      resultsCreated++;
    }

    // Trainer upskilling → proficiency improvement
    if (type === "TRAINER_UPSKILLING") {
      await db.scenarioImpactResult.create({
        data: {
          scenarioId,
          targetDimension: "PROFICIENCY_COVERAGE",
          targetId: iv.targetSkillId ?? null,
          baselineValue: "INTERMEDIATE",
          simulatedValue: "ADVANCED_CAPABLE",
          delta: "+1 proficiency level",
          metric: "trainer_proficiency",
          unit: "level",
          confidence: 0.5,
          assumptionCount: scenario.assumptions.length,
          dataStatus: "SIMULATED",
        },
      });
      resultsCreated++;
    }

    // Equipment upgrade → centre readiness improvement
    if (type === "EQUIPMENT_UPGRADE") {
      const baseReady = (baselineData.capability as { readyCourses?: number }).readyCourses ?? 0;
      await db.scenarioImpactResult.create({
        data: {
          scenarioId,
          targetDimension: "CENTRE_READINESS",
          targetId: iv.targetCentreId ?? null,
          baselineValue: "PARTIALLY_READY",
          simulatedValue: "READY",
          delta: "improved",
          metric: "centre_readiness",
          unit: "status",
          confidence: 0.5,
          assumptionCount: scenario.assumptions.length,
          dataStatus: "SIMULATED",
        },
      });
      resultsCreated++;
    }

    // New course → skill coverage improvement
    if (type === "NEW_COURSE" || type === "COURSE_EXPANSION") {
      await db.scenarioImpactResult.create({
        data: {
          scenarioId,
          targetDimension: "SKILL_COVERAGE",
          targetId: iv.targetSkillId ?? null,
          baselineValue: "PARTIAL_COVERAGE",
          simulatedValue: "FULL_COVERAGE",
          delta: "improved",
          metric: "skill_coverage",
          unit: "status",
          confidence: 0.6,
          assumptionCount: scenario.assumptions.length,
          dataStatus: "SIMULATED",
        },
      });
      resultsCreated++;
    }
  }

  // Update scenario status
  await db.policyScenario.update({ where: { id: scenarioId }, data: { status: "SIMULATED" } });

  // Create audit log
  await db.scenarioAuditLog.create({
    data: {
      scenarioId,
      action: "SIMULATED",
      baselineVersion: baseline.observationPeriod,
      modelVersion: "1.0",
      details: `Simulated ${scenario.interventions.length} interventions with ${scenario.assumptions.length} assumptions`,
    },
  });

  return { results: resultsCreated };
}

// ---------------------------------------------------------------------
// 4. Scenario comparison
// ---------------------------------------------------------------------

export async function compareScenarios(scenarioIds: string[]) {
  const scenarios = await db.policyScenario.findMany({
    where: { id: { in: scenarioIds } },
    include: {
      results: true,
      interventions: true,
      assumptions: true,
      baseline: true,
      district: true,
    },
  });
  return scenarios.map((s) => ({
    id: s.id,
    name: s.name,
    district: s.district.name,
    status: s.status,
    interventionCount: s.interventions.length,
    assumptionCount: s.assumptions.length,
    results: s.results.map((r) => ({
      dimension: r.targetDimension,
      baseline: r.baselineValue,
      simulated: r.simulatedValue,
      delta: r.delta,
      confidence: r.confidence,
      dataStatus: r.dataStatus,
    })),
  }));
}

// ---------------------------------------------------------------------
// 5. Outcome evaluation (pre/post comparison — NO causal claims)
// ---------------------------------------------------------------------

export async function evaluateIntervention(interventionId: string) {
  const intervention = await db.districtIntervention.findUnique({
    where: { id: interventionId },
    include: { kpis: { include: { observations: true } }, outcomes: true, milestones: true },
  });
  if (!intervention) return null;

  const kpiSummary = intervention.kpis.map((k) => {
    const latestObs = k.observations.sort((a, b) => b.observationPeriod.localeCompare(a.observationPeriod))[0];
    return {
      metricName: k.metricName,
      metricType: k.metricType,
      baseline: k.baselineValue,
      target: k.targetValue ?? "—",
      actual: latestObs?.observedValue ?? "INSUFFICIENT_DATA",
      unit: k.unit ?? "",
      targetAchievement: k.targetValue && latestObs?.observedValue ?
        `${Math.round((Number(latestObs.observedValue) / Number(k.targetValue)) * 100)}%` : "N/A",
    };
  });

  const outcomeSummary = intervention.outcomes.map((o) => ({
    type: o.outcomeType,
    baseline: o.baselineValue,
    observed: o.observedValue,
    change: o.change ?? "—",
    interpretation: o.interpretation ?? "INSUFFICIENT_DATA",
  }));

  return {
    intervention: {
      id: intervention.id,
      status: intervention.status,
      plannedStart: intervention.plannedStart,
      actualStart: intervention.actualStart,
      plannedEnd: intervention.plannedEnd,
      actualEnd: intervention.actualEnd,
    },
    kpis: kpiSummary,
    outcomes: outcomeSummary,
    milestones: intervention.milestones.map((m) => ({
      name: m.name,
      plannedDate: m.plannedDate,
      actualDate: m.actualDate,
      status: m.status,
    })),
    // Attribution safeguard: NO causal claim
    disclaimer: "Pre/post comparison only. Other factors may have contributed. NO causal claim without valid evaluation design.",
  };
}
