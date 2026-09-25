/**
 * KAUSHAL DRISHTI — Phase 6 Synthetic Demonstration Seed
 * ---------------------------------------------------------------------
 * ALL DATA IS SYNTHETIC DEMONSTRATION DATA.
 *
 * Generates:
 *  - 100+ curriculum versions (for active courses)
 *  - 300+ curriculum modules
 *  - 1000+ curriculum-skill mappings
 *  - 500+ curriculum-competency mappings
 *  - Trainers (300+) with skill/competency mappings
 *  - Training equipment (500+) with skill/course mappings
 *
 * Run: `bun run db:seed:phase6`
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
function mulberry32(seed: number) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(617);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const intBetween = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

async function main() {
  console.log("Seeding Phase 6 training relevance & delivery capability data…");
  await db.curriculumSkillMapping.deleteMany();
  await db.curriculumCompetencyMapping.deleteMany();
  await db.curriculumModule.deleteMany();
  await db.curriculumVersion.deleteMany();
  await db.courseRelevanceProfile.deleteMany();
  await db.roleRequirementProfile.deleteMany();
  await db.curriculumGapSignal.deleteMany();
  await db.equipmentCourseMapping.deleteMany();
  await db.equipmentSkillMapping.deleteMany();
  await db.trainingEquipment.deleteMany();
  await db.trainerCapabilityProfile.deleteMany();
  await db.trainerCompetencyMapping.deleteMany();
  await db.trainerSkillMapping.deleteMany();
  await db.trainer.deleteMany();
  await db.trainerCapabilityGap.deleteMany();
  await db.trainingCentreCapabilityProfile.deleteMany();
  await db.deliveryCapabilityGap.deleteMany();

  const courses = await db.course.findMany({ where: { status: "ACTIVE" }, include: { courseSkills: true, courseRoleMappings: true, sector: true } });
  const skills = await db.skill.findMany();
  const centres = await db.trainingCentre.findMany();
  const proficiencies = ["AWARENESS", "WORKING", "PROFICIENT", "EXPERT"];
  const coverageTypes = ["INTRODUCED", "PRACTICED", "ASSESSED", "MASTERED", "CERTIFIED"];

  // ===== Curriculum Versions + Modules + Mappings =====
  let cvCount = 0, modCount = 0, csmCount = 0, ccmCount = 0;
  for (const course of courses) {
    // Create 1-2 curriculum versions per course (some have historical versions)
    const numVersions = rand() > 0.6 ? 2 : 1;
    const baseDate = new Date(2024, intBetween(0, 11), 1);
    for (let v = 0; v < numVersions; v++) {
      const version = `v${numVersions - v}.${intBetween(0, 9)}`;
      const effectiveFrom = new Date(baseDate.getFullYear() + v, baseDate.getMonth(), 1);
      const effectiveTo = v === 0 && numVersions > 1 ? new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), 1) : null;
      const revisionDate = new Date(effectiveFrom.getFullYear(), effectiveFrom.getMonth() + intBetween(0, 3), intBetween(1, 28));
      const cv = await db.curriculumVersion.create({
        data: { courseId: course.id, version, effectiveFrom, effectiveTo, revisionDate, status: v === numVersions - 1 ? "ACTIVE" : "SUPERSEDED", dataStatus: "SYNTHETIC" },
      });
      cvCount++;
      // Create 2-4 modules per version
      const numModules = intBetween(2, 4);
      for (let m = 0; m < numModules; m++) {
        const mod = await db.curriculumModule.create({
          data: { curriculumVersionId: cv.id, name: `Module ${m + 1}: ${pick(["Fundamentals", "Applications", "Advanced Topics", "Practical Lab", "Assessment"])}`, sequence: m + 1, durationHours: intBetween(10, 80), description: "Synthetic demonstration curriculum module." },
        });
        modCount++;
        // Map 2-5 skills per module
        const numSkills = intBetween(2, 5);
        const selectedSkills: typeof skills = [];
        for (let s = 0; s < numSkills; s++) { const sk = pick(skills); if (!selectedSkills.find((x) => x.id === sk.id)) selectedSkills.push(sk); }
        for (const sk of selectedSkills) {
          const covType = pick(coverageTypes);
          await db.curriculumSkillMapping.create({
            data: { curriculumModuleId: mod.id, skillId: sk.id, coverageType: covType, coverageStrength: covType === "MASTERED" || covType === "CERTIFIED" ? 0.9 : covType === "ASSESSED" ? 0.7 : 0.5, expectedProficiency: pick(proficiencies), assessmentPresent: covType === "ASSESSED" || covType === "MASTERED", confidence: 0.6 + rand() * 0.35 },
          });
          csmCount++;
        }
        // Map 1-3 competencies per module
        const numComps = intBetween(1, 3);
        for (let c = 0; c < numComps; c++) {
          const compId = `comp-${course.id}-${m}-${c}`;
          try {
            await db.curriculumCompetencyMapping.create({
              data: { curriculumModuleId: mod.id, competencyId: compId, coverageType: pick(coverageTypes), coverageStrength: 0.4 + rand() * 0.5, expectedProficiency: pick(proficiencies), assessmentPresent: rand() > 0.5, confidence: 0.6 + rand() * 0.3 },
            });
            ccmCount++;
          } catch { /* unique constraint — skip */ }
        }
      }
    }
  }
  console.log(`  ✓ ${cvCount} curriculum versions, ${modCount} modules, ${csmCount} skill mappings, ${ccmCount} competency mappings`);

  // ===== Trainers =====
  let trainerCount = 0, tsmCount = 0, tcmCount = 0;
  const trainerTypes = ["INSTRUCTOR", "INDUSTRY_EXPERT", "GUEST", "ADJUNCT"];
  const verificationStatuses = ["SELF_DECLARED", "ASSESSED", "CERTIFIED", "EMPLOYER_VERIFIED", "INSTITUTION_VERIFIED"];
  for (const centre of centres) {
    const numTrainers = intBetween(1, 5);
    for (let t = 0; t < numTrainers; t++) {
      const trainer = await db.trainer.create({
        data: { trainingCentreId: centre.id, name: `Demo Trainer ${trainerCount + 1}`, trainerType: pick(trainerTypes), qualificationSummary: pick(["B.Tech", "M.Tech", "Diploma", "ITI Certified", "Industry Certified"]), experienceYears: intBetween(2, 25), industryExperience: pick(["Manufacturing", "Automotive", "IT", "Electronics", "General"]), status: rand() > 0.1 ? "ACTIVE" : "INACTIVE", dataStatus: "SYNTHETIC" },
      });
      trainerCount++;
      // Map 2-5 skills per trainer
      const numSkills = intBetween(2, 5);
      const selectedSkills: typeof skills = [];
      for (let s = 0; s < numSkills; s++) { const sk = pick(skills); if (!selectedSkills.find((x) => x.id === sk.id)) selectedSkills.push(sk); }
      for (const sk of selectedSkills) {
        await db.trainerSkillMapping.create({
          data: { trainerId: trainer.id, skillId: sk.id, proficiencyLevel: pick(proficiencies), verificationStatus: pick(verificationStatuses), lastVerifiedAt: new Date(2024, intBetween(0, 11), intBetween(1, 28)), confidence: 0.5 + rand() * 0.45 },
        });
        tsmCount++;
      }
      // Map 1-3 competencies
      const numComps = intBetween(1, 3);
      for (let c = 0; c < numComps; c++) {
        try {
          await db.trainerCompetencyMapping.create({ data: { trainerId: trainer.id, competencyId: `comp-trainer-${trainer.id}-${c}`, proficiencyLevel: pick(proficiencies), verificationStatus: pick(verificationStatuses), lastVerifiedAt: new Date(2024, intBetween(0, 11), intBetween(1, 28)), confidence: 0.5 + rand() * 0.4 } });
          tcmCount++;
        } catch { /* skip */ }
      }
      // Create capability profile
      await db.trainerCapabilityProfile.create({
        data: { trainerId: trainer.id, highestVerifiedProficiency: pick(proficiencies), industryExperience: trainer.industryExperience, qualificationLevel: trainer.qualificationSummary, capabilityConfidence: 0.5 + rand() * 0.4, freshnessStatus: pick(["CURRENT", "RECENTLY_UPDATED", "AGING", "STALE"]), observationPeriod: "2026-09", dataStatus: "SYNTHETIC" },
      });
    }
  }
  console.log(`  ✓ ${trainerCount} trainers, ${tsmCount} skill mappings, ${tcmCount} competency mappings`);

  // ===== Equipment =====
  let equipCount = 0, esmCount = 0, ecmCount = 0;
  const equipTypes = ["PLC_TRAINER", "ROBOTICS_ARM", "CNC_MACHINE", "EV_BATTERY_TESTER", "IOT_KIT", "COMPUTER_LAB", "WELDING_EQUIPMENT", "MULTIMETER", "OSCILLOSCOPE", "GENERAL_LAB"];
  const conditions = ["OPERATIONAL", "PARTIALLY_OPERATIONAL", "UNDER_MAINTENANCE", "NON_OPERATIONAL"];
  for (const centre of centres) {
    const numEquipment = intBetween(2, 8);
    for (let e = 0; e < numEquipment; e++) {
      const eqType = pick(equipTypes);
      const qty = intBetween(1, 20);
      const opQty = rand() > 0.2 ? qty : intBetween(0, qty - 1);
      const equip = await db.trainingEquipment.create({
        data: { trainingCentreId: centre.id, name: `Demo ${eqType.replace(/_/g, " ")} ${equipCount + 1}`, equipmentType: eqType, manufacturer: pick(["Demo Mfg Co", "Synthetic Industries", "Demo Tech"]), model: `Model-${intBetween(100, 999)}`, quantity: qty, operationalQuantity: opQty, conditionStatus: opQty === 0 ? "NON_OPERATIONAL" : opQty < qty ? "PARTIALLY_OPERATIONAL" : "OPERATIONAL", acquisitionDate: new Date(intBetween(2018, 2025), intBetween(0, 11), 1), lastMaintenanceDate: new Date(2025, intBetween(0, 11), intBetween(1, 28)), currencyStatus: pick(["CURRENT", "AGING", "OUTDATED", "UNKNOWN"]), status: "ACTIVE", dataStatus: "SYNTHETIC" },
      });
      equipCount++;
      // Map 1-3 skills per equipment
      const numSkills = intBetween(1, 3);
      const selectedSkills: typeof skills = [];
      for (let s = 0; s < numSkills; s++) { const sk = pick(skills); if (!selectedSkills.find((x) => x.id === sk.id)) selectedSkills.push(sk); }
      for (const sk of selectedSkills) {
        await db.equipmentSkillMapping.create({ data: { equipmentId: equip.id, skillId: sk.id, requiredQuantity: intBetween(1, 5), coverageStrength: 0.5 + rand() * 0.4, confidence: 0.6 + rand() * 0.3 } });
        esmCount++;
      }
      // Map to 1-3 courses at this centre
      const centreCourses = await db.courseOffering.findMany({ where: { trainingCentreId: centre.id }, select: { courseId: true }, distinct: ["courseId"], take: 5 });
      const numCourses = Math.min(intBetween(1, 3), centreCourses.length);
      for (let c = 0; c < numCourses; c++) {
        const off = centreCourses[Math.floor(rand() * centreCourses.length)];
        if (!off) continue;
        try {
          await db.equipmentCourseMapping.create({ data: { equipmentId: equip.id, courseId: off.courseId, requiredQuantity: intBetween(1, 5), minimumCapacity: intBetween(5, 20), coverageStrength: 0.5 + rand() * 0.4, confidence: 0.6 + rand() * 0.3 } });
          ecmCount++;
        } catch { /* unique — skip */ }
      }
    }
  }
  console.log(`  ✓ ${equipCount} equipment items, ${esmCount} skill mappings, ${ecmCount} course mappings`);
  console.log("✓ Phase 6 seed complete. ALL DATA IS SYNTHETIC.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
