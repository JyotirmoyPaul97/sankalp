/**
 * KAUSHAL DRISHTI — Phase 8 Synthetic Seed
 * ---------------------------------------------------------------------
 * ALL DATA IS SYNTHETIC DEMONSTRATION DATA.
 * Creates: intervention types, scenarios, interventions, baselines,
 * district interventions with milestones/KPIs/outcomes, alerts, plans.
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
function mulberry32(seed: number) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(821);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const intBetween = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

async function main() {
  console.log("Seeding Phase 8 digital twin + policy sandbox data…");
  // Wipe Phase 8 tables
  await db.districtAlert.deleteMany();
  await db.interventionLesson.deleteMany();
  await db.kpiObservation.deleteMany();
  await db.interventionKpi.deleteMany();
  await db.interventionOutcome.deleteMany();
  await db.interventionMilestone.deleteMany();
  await db.districtIntervention.deleteMany();
  await db.districtPlanVersion.deleteMany();
  await db.districtSkillPlan.deleteMany();
  await db.scenarioAuditLog.deleteMany();
  await db.scenarioImpactResult.deleteMany();
  await db.scenarioAssumption.deleteMany();
  await db.scenarioIntervention.deleteMany();
  await db.policyScenario.deleteMany();
  await db.districtBaseline.deleteMany();
  await db.interventionType.deleteMany();

  // ===== Intervention Types =====
  const typeDefs = [
    { name: "Course Capacity Expansion", code: "COURSE_EXPANSION", category: "COURSE" },
    { name: "New Course Creation", code: "NEW_COURSE", category: "COURSE" },
    { name: "Curriculum Update", code: "CURRICULUM_UPDATE", category: "COURSE" },
    { name: "Trainer Upskilling", code: "TRAINER_UPSKILLING", category: "TRAINER" },
    { name: "New Trainer Capacity", code: "NEW_TRAINER_CAPACITY", category: "TRAINER" },
    { name: "Equipment Upgrade", code: "EQUIPMENT_UPGRADE", category: "EQUIPMENT" },
    { name: "New Training Centre", code: "NEW_TRAINING_CENTRE", category: "CENTRE" },
    { name: "Centre Capacity Expansion", code: "CENTRE_CAPACITY_EXPANSION", category: "CENTRE" },
    { name: "Industry Collaboration", code: "INDUSTRY_COLLABORATION", category: "INDUSTRY" },
    { name: "Assessment Expansion", code: "ASSESSMENT_EXPANSION", category: "ASSESSMENT" },
  ];
  for (const t of typeDefs) await db.interventionType.create({ data: t });
  console.log(`  ✓ ${typeDefs.length} intervention types`);

  // ===== Districts =====
  const districts = await db.district.findMany();
  const skills = await db.skill.findMany();
  const courses = await db.course.findMany({ where: { status: "ACTIVE" } });
  const jobRoles = await db.jobRole.findMany();

  // ===== Policy Scenarios =====
  let scenarioCount = 0;
  for (let i = 0; i < 5; i++) {
    const district = pick(districts);
    const skill = pick(skills);
    const course = pick(courses);
    const role = pick(jobRoles);
    const scenario = await db.policyScenario.create({
      data: { name: `Demo Scenario ${i + 1}: ${pick(["Capacity Expansion", "Trainer Upskilling", "Equipment Upgrade", "Combined Intervention", "New Course"])}`, description: `Synthetic demonstration scenario for ${district.name}.`, districtId: district.id, status: i < 3 ? "SIMULATED" : "DRAFT", dataStatus: "SYNTHETIC" },
    });

    // Add interventions
    const ivTypeCodes = i === 0 ? ["COURSE_EXPANSION"] : i === 1 ? ["TRAINER_UPSKILLING"] : i === 2 ? ["EQUIPMENT_UPGRADE"] : i === 3 ? ["COURSE_EXPANSION", "TRAINER_UPSKILLING"] : ["NEW_COURSE"];
    for (const code of ivTypeCodes) {
      const ivType = await db.interventionType.findUnique({ where: { code } });
      if (!ivType) continue;
      await db.scenarioIntervention.create({
        data: {
          scenarioId: scenario.id,
          interventionTypeId: ivType.id,
          targetCourseId: course.id,
          targetSkillId: skill.id,
          targetRoleId: role.id,
          capacityChange: code === "COURSE_EXPANSION" || code === "NEW_COURSE" || code === "CENTRE_CAPACITY_EXPANSION" ? intBetween(50, 200) : null,
          quantity: code === "TRAINER_UPSKILLING" ? intBetween(2, 8) : null,
        },
      });
    }

    // Add assumptions
    await db.scenarioAssumption.create({ data: { scenarioId: scenario.id, name: "implementation_period", value: "12 months", unit: "months", description: "Assumed implementation period" } });
    await db.scenarioAssumption.create({ data: { scenarioId: scenario.id, name: "additional_capacity", value: String(intBetween(50, 200)), unit: "seats", description: "Hypothetical additional training capacity" } });
    await db.scenarioAssumption.create({ data: { scenarioId: scenario.id, name: "trainer_requirement", value: String(intBetween(2, 8)), unit: "trainers", description: "Required trainers for the intervention" } });

    // Simulate if status is SIMULATED
    if (scenario.status === "SIMULATED") {
      // Create baseline
      const existingBaseline = await db.districtBaseline.findFirst({ where: { district: { id: district.id }, observationPeriod: "2026-09" } }); if (existingBaseline) { await db.policyScenario.update({ where: { id: scenario.id }, data: { baselineId: existingBaseline.id } }); continue; }
      const baseline = await db.districtBaseline.create({
        data: { districtId: district.id, observationPeriod: "2026-09", marketSnapshot: JSON.stringify({ topSkills: [{ name: skill.name, signal: 88 }] }), trainingSnapshot: JSON.stringify({ plannedCapacity: 210, enrolled: 150 }), capabilitySnapshot: JSON.stringify({ readyCourses: 5, partiallyReadyCourses: 12 }), candidateSnapshot: JSON.stringify({ highGapCount: 3 }), outcomeSnapshot: JSON.stringify({ placementRecords: 45 }), dataStatus: "SYNTHETIC" },
      });
      await db.policyScenario.update({ where: { id: scenario.id }, data: { baselineId: baseline.id } });
      // Create impact results
      const ivs = await db.scenarioIntervention.findMany({ where: { scenarioId: scenario.id }, include: { interventionType: true } });
      for (const iv of ivs) {
        if (iv.capacityChange && iv.capacityChange !== 0) {
          await db.scenarioImpactResult.create({ data: { scenarioId: scenario.id, targetDimension: "TRAINING_CAPACITY", targetId: iv.targetSkillId ?? null, baselineValue: "210", simulatedValue: String(210 + iv.capacityChange), delta: `+${iv.capacityChange}`, metric: "planned_seats", unit: "seats", confidence: 0.6, assumptionCount: 3, dataStatus: "SIMULATED" } });
          await db.scenarioImpactResult.create({ data: { scenarioId: scenario.id, targetDimension: "GAP_SIGNAL", baselineValue: "3 high gaps", simulatedValue: "1 high gaps", delta: "-2", metric: "high_gap_count", unit: "count", confidence: 0.4, assumptionCount: 3, dataStatus: "SIMULATED" } });
        }
        if (iv.interventionType.code === "TRAINER_UPSKILLING") {
          await db.scenarioImpactResult.create({ data: { scenarioId: scenario.id, targetDimension: "PROFICIENCY_COVERAGE", targetId: iv.targetSkillId ?? null, baselineValue: "INTERMEDIATE", simulatedValue: "ADVANCED_CAPABLE", delta: "+1 level", metric: "trainer_proficiency", unit: "level", confidence: 0.5, assumptionCount: 3, dataStatus: "SIMULATED" } });
        }
        if (iv.interventionType.code === "EQUIPMENT_UPGRADE") {
          await db.scenarioImpactResult.create({ data: { scenarioId: scenario.id, targetDimension: "CENTRE_READINESS", baselineValue: "PARTIALLY_READY", simulatedValue: "READY", delta: "improved", metric: "centre_readiness", unit: "status", confidence: 0.5, assumptionCount: 3, dataStatus: "SIMULATED" } });
        }
      }
      await db.scenarioAuditLog.create({ data: { scenarioId: scenario.id, action: "SIMULATED", baselineVersion: "2026-09", modelVersion: "1.0", details: `Simulated ${ivs.length} interventions` } });
    }
    scenarioCount++;
  }
  console.log(`  ✓ ${scenarioCount} policy scenarios with interventions, assumptions, results`);

  // ===== District Interventions (implementation tracking) =====
  let interventionCount = 0;
  for (let i = 0; i < 8; i++) {
    const district = pick(districts);
    const ivType = pick(typeDefs);
    const ivTypeRecord = await db.interventionType.findUnique({ where: { code: ivType.code } });
    if (!ivTypeRecord) continue;
    const status = pick(["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED"]);
    const plannedStart = new Date(2026, 0, 1);
    const plannedEnd = new Date(2026, 11, 31);
    const actualStart = status !== "PLANNED" ? new Date(2026, 1, 15) : null;
    const actualEnd = status === "COMPLETED" ? new Date(2026, 8, 30) : null;

    const intervention = await db.districtIntervention.create({
      data: {
        interventionTypeId: ivTypeRecord.id,
        districtId: district.id,
        targetSkillId: pick(skills).id,
        plannedStart, plannedEnd, actualStart, actualEnd,
        status, owner: "Demo District Admin", notes: "Synthetic demonstration intervention.",
        dataStatus: "SYNTHETIC",
      },
    });

    // Milestones
    for (let m = 1; m <= 3; m++) {
      await db.interventionMilestone.create({
        data: {
          interventionId: intervention.id,
          name: pick(["Trainers enrolled", "Training completed", "Assessment passed", "Centre capability updated", "Equipment procured", "Course launched"]),
          plannedDate: new Date(2026, m * 3, 15),
          actualDate: status === "COMPLETED" || (status === "IN_PROGRESS" && m <= 2) ? new Date(2026, m * 3, intBetween(10, 25)) : null,
          status: status === "COMPLETED" ? "COMPLETED" : status === "IN_PROGRESS" && m <= 2 ? "COMPLETED" : "PENDING",
        },
      });
    }

    // KPIs
    const kpi = await db.interventionKpi.create({
      data: {
        interventionId: intervention.id,
        metricName: pick(["Training Capacity", "Enrollment", "Completion Rate", "Certification Count"]),
        metricType: pick(["CAPACITY", "ENROLLMENT", "COMPLETION", "CERTIFICATION"]),
        baselineValue: String(intBetween(100, 300)),
        baselinePeriod: "2026-09",
        targetValue: String(intBetween(200, 400)),
        targetPeriod: "2027-06",
        unit: pick(["seats", "count", "%"]),
        confidence: 0.5 + rand() * 0.3,
      },
    });

    // KPI observations (for completed/in-progress interventions)
    if (status !== "PLANNED") {
      await db.kpiObservation.create({
        data: {
          kpiId: kpi.id,
          observationPeriod: "2027-03",
          observedValue: String(intBetween(150, 380)),
          confidence: 0.6, dataStatus: "SYNTHETIC",
        },
      });
    }

    // Outcomes
    if (status === "COMPLETED") {
      await db.interventionOutcome.create({
        data: {
          interventionId: intervention.id,
          outcomeType: pick(["CAPACITY_CHANGE", "TRAINING_COVERAGE_CHANGE", "PROFICIENCY_CHANGE", "COMPLETION_CHANGE"]),
          baselineValue: String(intBetween(100, 300)),
          observedValue: String(intBetween(200, 400)),
          change: "+82",
          observationPeriod: "2027-06",
          confidence: 0.6,
          interpretation: "Coverage improved after intervention. Other factors may also have contributed.",
          dataStatus: "SYNTHETIC",
        },
      });
    }

    interventionCount++;
  }
  console.log(`  ✓ ${interventionCount} district interventions with milestones, KPIs, outcomes`);

  // ===== Alerts =====
  const alertDefs = [
    { alertType: "IMPLEMENTATION_DELAY", severity: "WARNING", evidence: "Intervention milestone delayed by 2 months" },
    { alertType: "KPI_BELOW_TARGET", severity: "NOTICE", evidence: "Enrollment at 65% of target" },
    { alertType: "MARKET_REQUIREMENT_CHANGE", severity: "WARNING", evidence: "New emerging skill detected for target role" },
    { alertType: "GAP_WORSENING", severity: "CRITICAL", evidence: "Skill gap signal increased from MODERATE to HIGH" },
    { alertType: "DATA_FRESHNESS", severity: "INFO", evidence: "Market data last updated 30 days ago" },
  ];
  for (const a of alertDefs) {
    await db.districtAlert.create({ data: { district: { connect: { id: pick(districts).id } }, alertType: a.alertType, severity: a.severity, evidence: a.evidence, status: "ACTIVE" } });
  }
  console.log(`  ✓ ${alertDefs.length} alerts`);

  console.log("✓ Phase 8 seed complete. ALL DATA IS SYNTHETIC.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
