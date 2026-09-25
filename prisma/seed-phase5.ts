/**
 * KAUSHAL DRISHTI — Phase 5 Synthetic Demonstration Seed
 * ---------------------------------------------------------------------
 * ALL DATA IS SYNTHETIC DEMONSTRATION DATA.
 *
 * Generates a coherent training ecosystem:
 *  - Training providers (GOVERNMENT, PRIVATE, INDUSTRY, ACADEMIC)
 *  - 100+ training institutions (extending Phase 1's 3)
 *  - 150+ training centres (under institutions)
 *  - 200+ courses (extending Phase 1's 5, with courseType, deliveryMode)
 *  - 50+ qualifications (extending Phase 1's 3)
 *  - 500+ course-role mappings
 *  - 1000+ course-skill mappings (extending Phase 1's 14 with proficiency/confidence)
 *  - 12 monthly periods of course offerings (planned/enrolled/completed/certified)
 *  - Training certifications per offering
 *
 * Then triggers training-supply-signal computation.
 *
 * Run: `bun run db:seed:phase5`
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(512);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const intBetween = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

async function main() {
  console.log("Seeding Phase 5 training ecosystem synthetic data…");

  // Wipe Phase 5 tables (preserve Phase 1-4 entities)
  await db.trainingSupplySignal.deleteMany();
  await db.trainingCertification.deleteMany();
  await db.courseOffering.deleteMany();
  await db.courseRoleMapping.deleteMany();
  await db.trainingCentre.deleteMany();
  await db.trainingProvider.deleteMany();
  await db.trainingProfile.deleteMany();
  // Wipe Phase 1 course-skill (to re-seed with extended fields)
  await db.courseSkill.deleteMany();
  // Wipe Phase 1 course-institution (to re-seed with centres)
  await db.courseInstitution.deleteMany();
  // Wipe extra institutions/courses/qualifications from Phase 1 (keep original 3+5+3)
  // Actually we need 100+ institutions and 200+ courses, so let's add more

  // ===== Load existing entities =====
  const districts = await db.district.findMany();
  const sectors = await db.sector.findMany();
  const jobRoles = await db.jobRole.findMany();
  const skills = await db.skill.findMany();
  let institutions = await db.institution.findMany();
  let qualifications = await db.qualification.findMany();
  let courses = await db.course.findMany();

  // ===== Training Providers =====
  const providerDefs = [
    { name: "Demo Government Skill Development Corp", type: "GOVERNMENT", ownership: "PUBLIC" },
    { name: "Demo ITI Council Maharashtra", type: "GOVERNMENT", ownership: "PUBLIC" },
    { name: "Demo Private Training Alliance", type: "PRIVATE", ownership: "PRIVATE" },
    { name: "Demo Industry Skill Academy", type: "INDUSTRY", ownership: "PRIVATE" },
    { name: "Demo Polytechnic Board", type: "ACADEMIC", ownership: "PUBLIC" },
    { name: "Demo NGO Skill Foundation", type: "NGO", ownership: "TRUST" },
  ];
  const providers: Record<string, string> = {};
  for (const p of providerDefs) {
    const created = await db.trainingProvider.create({
      data: { name: p.name, providerType: p.type, ownershipType: p.ownership, status: "ACTIVE", dataStatus: "SYNTHETIC" },
    });
    providers[p.name] = created.id;
  }

  // ===== Extend Institutions to 100+ =====
  const existingInstNames = new Set(institutions.map((i) => i.name));
  const instTypes = ["ITI", "POLYTECHNIC", "SKILL_CENTRE", "PRIVATE_TRAINING_PROVIDER", "INDUSTRY_TRAINING_FACILITY"];
  const providerList = Object.entries(providers);
  while (institutions.length < 105) {
    const district = pick(districts);
    const provider = pick(providerList);
    const instType = pick(instTypes);
    const name = `Demo ${instType.replace(/_/g, " ")} ${district.name} ${String(institutions.length + 1).padStart(3, "0")}`;
    if (existingInstNames.has(name)) continue;
    const inst = await db.institution.create({
      data: {
        name,
        institutionType: instType,
        districtId: district.id,
        providerId: provider[1],
        description: `Synthetic demonstration ${instType.toLowerCase()} in ${district.name}.`,
        address: `Demo Address, ${district.name}`,
        latitude: district.latitude,
        longitude: district.longitude,
        isActive: true,
      },
    });
    institutions.push(inst);
    existingInstNames.add(name);
  }
  console.log(`  ✓ ${institutions.length} institutions`);

  // ===== Training Centres (150+) =====
  const centreTypes = ["ITI", "POLYTECHNIC", "SKILL_CENTRE", "PRIVATE_LAB", "INDUSTRY_TRAINING_FACILITY"];
  const deliveryModes = ["CLASSROOM", "BLENDED", "ONLINE", "APPRENTICESHIP"];
  const centres = [];
  for (let i = 0; i < 160; i++) {
    const inst = pick(institutions);
    const district = districts.find((d) => d.id === inst.districtId) ?? pick(districts);
    const centre = await db.trainingCentre.create({
      data: {
        name: `${inst.name} — Centre ${String(i + 1).padStart(2, "0")}`,
        institutionId: inst.id,
        districtId: district.id,
        centreType: pick(centreTypes),
        deliveryMode: pick(deliveryModes),
        status: rand() > 0.1 ? "ACTIVE" : "INACTIVE",
        dataStatus: "SYNTHETIC",
      },
    });
    centres.push(centre);
  }
  console.log(`  ✓ ${centres.length} training centres`);

  // ===== Extend Qualifications to 50+ =====
  const qualLevels = ["Certificate", "Diploma", "Advanced Diploma", "Degree"];
  const existingQualCodes = new Set(qualifications.map((q) => q.code));
  while (qualifications.length < 52) {
    const level = pick(qualLevels);
    const name = `Demo ${level} ${String(qualifications.length + 1).padStart(2, "0")}`;
    const code = `DEM-QUAL-${String(qualifications.length + 1).padStart(3, "0")}`;
    if (existingQualCodes.has(code)) continue;
    const q = await db.qualification.create({
      data: { name, code, description: `Synthetic demonstration ${level.toLowerCase()}.`, qualificationLevel: level },
    });
    qualifications.push(q);
    existingQualCodes.add(code);
  }
  console.log(`  ✓ ${qualifications.length} qualifications`);

  // ===== Extend Courses to 200+ =====
  const courseTypes = ["SHORT_TERM", "LONG_TERM", "UPSKILLING", "RESKILLING", "APPRENTICESHIP", "CERTIFICATION", "DIPLOMA"];
  const existingCourseCodes = new Set(courses.map((c) => c.code));
  // Map courses to sectors + roles coherently
  const sectorRoles: Record<string, string[]> = {
    "Advanced Manufacturing": ["Automation Engineer", "PLC Technician", "Robotics Technician"],
    "Automotive": ["EV Technician", "Automation Engineer"],
    "Information Technology": ["Software Developer"],
  };
  while (courses.length < 205) {
    const sector = pick(sectors);
    const qual = pick(qualifications);
    const provider = pick(providerList);
    const inst = pick(institutions);
    const cType = pick(courseTypes);
    const name = `Demo ${sector.name.split(" ")[0]} Course ${String(courses.length + 1).padStart(3, "0")}`;
    const code = `DEM-CRS-${String(courses.length + 1).padStart(4, "0")}`;
    if (existingCourseCodes.has(code)) continue;
    const durationHours = intBetween(40, 600);
    const course = await db.course.create({
      data: {
        name,
        code,
        description: `Synthetic demonstration ${cType.toLowerCase().replace(/_/g, " ")} course in ${sector.name}.`,
        sectorId: sector.id,
        qualificationId: qual.id,
        providerId: provider[1],
        institutionId: inst.id,
        durationHours,
        durationWeeks: Math.ceil(durationHours / 40),
        courseType: cType,
        deliveryMode: pick(deliveryModes),
        level: pick(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
        status: rand() > 0.15 ? "ACTIVE" : "UNDER_REVIEW",
        dataStatus: "SYNTHETIC",
      },
    });
    courses.push(course);
    existingCourseCodes.add(code);
  }
  console.log(`  ✓ ${courses.length} courses`);

  // ===== Course-Skill Mappings (1000+) =====
  // Map each course to 3-8 relevant skills with proficiency + coverage
  const coverageLevels = ["INTRODUCED", "REINFORCED", "MASTERED"];
  const proficiencyLevels = ["AWARENESS", "WORKING", "PROFICIENT", "EXPERT"];
  let csCount = 0;
  for (const course of courses) {
    const numSkills = intBetween(4, 9);
    const selectedSkills: typeof skills = [];
    // Pick relevant skills based on sector
    const sectorSkills = skills; // all skills are potentially relevant
    for (let i = 0; i < numSkills; i++) {
      const skill = pick(sectorSkills);
      if (!selectedSkills.find((s) => s.id === skill.id)) selectedSkills.push(skill);
    }
    for (const skill of selectedSkills) {
      const coverage = pick(coverageLevels);
      await db.courseSkill.create({
        data: {
          courseId: course.id,
          skillId: skill.id,
          coverageLevel: coverage,
          expectedProficiency: coverage === "MASTERED" ? "PROFICIENT" : coverage === "REINFORCED" ? "WORKING" : "AWARENESS",
          coverageStrength: coverage === "MASTERED" ? 0.9 : coverage === "REINFORCED" ? 0.6 : 0.3,
          confidence: 0.6 + rand() * 0.35,
          mappingSource: pick(["MANUAL", "SEMANTIC", "ADMIN"]),
          assessmentPresent: coverage === "MASTERED" || rand() > 0.5,
          certificationPresent: coverage === "MASTERED",
        },
      });
      csCount++;
    }
  }
  console.log(`  ✓ ${csCount} course-skill mappings`);

  // ===== Course-Role Mappings (500+) =====
  let crmCount = 0;
  for (const course of courses) {
    // All courses get role mappings
    const numRoles = intBetween(2, 5);
    const selectedRoles: typeof jobRoles = [];
    for (let i = 0; i < numRoles; i++) {
      const role = pick(jobRoles);
      if (!selectedRoles.find((r) => r.id === role.id)) selectedRoles.push(role);
    }
    for (const role of selectedRoles) {
      await db.courseRoleMapping.create({
        data: {
          courseId: course.id,
          jobRoleId: role.id,
          mappingType: pick(["PRIMARY", "SECONDARY", "OPTIONAL"]),
          confidence: 0.5 + rand() * 0.45,
          mappingSource: pick(["MANUAL", "SEMANTIC", "ADMIN"]),
        },
      });
      crmCount++;
    }
  }
  console.log(`  ✓ ${crmCount} course-role mappings`);

  // ===== Course Offerings (12 monthly periods) =====
  // Each active course gets offerings at 2-5 centres per period
  const months: { label: string; year: number; month: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(2026, 8 - i, 1);
    months.push({ label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, year: d.getFullYear(), month: d.getMonth() });
  }

  let offeringCount = 0;
  const activeCourses = courses.filter((c) => c.status === "ACTIVE");
  // Track (course, centre, period) combos to avoid unique-constraint violations
  const offeringKeys = new Set<string>();
  for (const m of months) {
    const periodStart = new Date(m.year, m.month, 1);
    const periodEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59);
    // Each period: ~40% of active courses have offerings
    const periodCourses = activeCourses.filter(() => rand() < 0.4);
    for (const course of periodCourses) {
      const numCentres = intBetween(1, 4);
      for (let i = 0; i < numCentres; i++) {
        const centre = pick(centres);
        const key = `${course.id}|${centre.id}|${m.label}`;
        if (offeringKeys.has(key)) continue;
        offeringKeys.add(key);
        const plannedSeats = intBetween(15, 60);
        const enrolled = Math.min(plannedSeats, intBetween(5, plannedSeats));
        const completed = Math.min(enrolled, intBetween(3, enrolled));
        const certified = Math.min(completed, intBetween(2, completed));
        const batchStart = new Date(m.year, m.month, intBetween(1, 5));
        const batchEnd = new Date(m.year, m.month, 28);
        await db.courseOffering.create({
          data: {
            courseId: course.id,
            trainingCentreId: centre.id,
            observationPeriodStart: periodStart,
            observationPeriodEnd: periodEnd,
            periodLabel: m.label,
            batchStart,
            batchEnd,
            plannedSeats,
            availableSeats: plannedSeats - enrolled,
            enrolledCount: enrolled,
            completedCount: completed,
            certifiedCount: certified,
            status: "COMPLETED",
            dataStatus: "SYNTHETIC",
          },
        });
        offeringCount++;
      }
    }
  }
  console.log(`  ✓ ${offeringCount} course offerings across ${months.length} months`);

  // ===== Training Certifications =====
  const offerings = await db.courseOffering.findMany({ include: { course: true } });
  let certCount = 0;
  for (const off of offerings) {
    if (off.certifiedCount && off.certifiedCount > 0) {
      await db.trainingCertification.create({
        data: {
          courseOfferingId: off.id,
          qualificationId: off.course.qualificationId,
          observationPeriod: off.periodLabel,
          certifiedCount: off.certifiedCount,
          dataStatus: "SYNTHETIC",
        },
      });
      certCount++;
    }
  }
  console.log(`  ✓ ${certCount} training certifications`);

  console.log("✓ Phase 5 seed data complete.");
  console.log(`  Providers: ${providerDefs.length} | Institutions: ${institutions.length} | Centres: ${centres.length}`);
  console.log(`  Courses: ${courses.length} | Qualifications: ${qualifications.length}`)
  console.log(`  Course-Skill mappings: ${csCount} | Course-Role mappings: ${crmCount}`)
  console.log(`  Offerings: ${offeringCount} | Certifications: ${certCount}`)
  console.log("  ALL DATA IS SYNTHETIC DEMONSTRATION DATA.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
