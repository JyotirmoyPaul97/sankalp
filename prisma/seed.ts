/**
 * KAUSHAL DRISHTI — Synthetic Demonstration Seed
 * ---------------------------------------------------------------------
 * ALL DATA IN THIS SCRIPT IS SYNTHETIC DEMONSTRATION DATA.
 * It is NOT actual Maharashtra Government data and must never be
 * represented as such. It exists only to exercise the Phase 1 schema,
 * API, and UI shell.
 *
 * Run: `bun run db:seed`
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding KAUSHAL DRISHTI synthetic demonstration data…");

  // ---- wipe (idempotent) ----
  await db.user.deleteMany();
  await db.employerRole.deleteMany();
  await db.courseInstitution.deleteMany();
  await db.courseSkill.deleteMany();
  await db.roleSkill.deleteMany();
  await db.course.deleteMany();
  await db.institution.deleteMany();
  await db.employer.deleteMany();
  await db.jobRole.deleteMany();
  await db.qualification.deleteMany();
  await db.skill.deleteMany();
  await db.sector.deleteMany();
  await db.district.deleteMany();
  await db.dataSource.deleteMany();

  // ===== Districts =====
  const pune = await db.district.create({
    data: {
      name: "Pune",
      code: "MH-PUNE",
      stateCode: "MH",
      latitude: 18.5204,
      longitude: 73.8567,
    },
  });
  const nashik = await db.district.create({
    data: {
      name: "Nashik",
      code: "MH-NASHIK",
      stateCode: "MH",
      latitude: 19.9975,
      longitude: 73.7898,
    },
  });
  const nagpur = await db.district.create({
    data: {
      name: "Nagpur",
      code: "MH-NAGPUR",
      stateCode: "MH",
      latitude: 21.1458,
      longitude: 79.0882,
    },
  });

  // ===== Sectors =====
  const advMfg = await db.sector.create({
    data: { name: "Advanced Manufacturing", code: "ADV-MFG", description: "Smart manufacturing, industrial automation, and Industry 4.0." },
  });
  const automotive = await db.sector.create({
    data: { name: "Automotive", code: "AUTO", description: "Vehicle manufacturing, EV, and automotive supply chain." },
  });
  const it = await db.sector.create({
    data: { name: "Information Technology", code: "IT", description: "Software, data, cloud, and digital services." },
  });

  // ===== Skills =====
  const skillDefs = [
    { name: "PLC Programming", canonicalName: "plc-programming", category: "Technical", description: "Programmable Logic Controller logic and ladder programming." },
    { name: "SCADA", canonicalName: "scada", category: "Technical", description: "Supervisory Control and Data Acquisition systems." },
    { name: "Industrial Robotics", canonicalName: "industrial-robotics", category: "Technical", description: "Robot programming, teach pendant, and cell integration." },
    { name: "Industrial IoT", canonicalName: "industrial-iot", category: "Digital", description: "Industrial Internet of Things, edge, and OT/IT integration." },
    { name: "Python", canonicalName: "python", category: "Digital", description: "Python programming for automation, data, and scripting." },
    { name: "SQL", canonicalName: "sql", category: "Digital", description: "Relational database querying and modelling." },
    { name: "Battery Management Systems", canonicalName: "battery-management-systems", category: "Technical", description: "BMS architecture, cell balancing, and EV energy control." },
    { name: "Electric Motor Drives", canonicalName: "electric-motor-drives", category: "Technical", description: "Motor drive electronics and EV propulsion control." },
    { name: "Embedded Systems", canonicalName: "embedded-systems", category: "Technical", description: "Microcontroller firmware and real-time embedded design." },
    { name: "Workplace Safety", canonicalName: "workplace-safety", category: "Safety", description: "Shop-floor safety practices and hazard control." },
  ];
  const skills = await Promise.all(
    skillDefs.map((s) => db.skill.create({ data: s }))
  );
  const skillByCode = Object.fromEntries(skills.map((s) => [s.canonicalName, s]));

  // ===== Job Roles =====
  const automationEng = await db.jobRole.create({
    data: { title: "Automation Engineer", canonicalTitle: "automation-engineer", description: "Designs and maintains automated production systems.", sectorId: advMfg.id },
  });
  const plcTech = await db.jobRole.create({
    data: { title: "PLC Technician", canonicalTitle: "plc-technician", description: "Installs and troubleshoots PLC-based control systems.", sectorId: advMfg.id },
  });
  const roboticsTech = await db.jobRole.create({
    data: { title: "Robotics Technician", canonicalTitle: "robotics-technician", description: "Operates and maintains industrial robotic cells.", sectorId: advMfg.id },
  });
  const softwareDev = await db.jobRole.create({
    data: { title: "Software Developer", canonicalTitle: "software-developer", description: "Builds and maintains software applications.", sectorId: it.id },
  });
  const evTech = await db.jobRole.create({
    data: { title: "EV Technician", canonicalTitle: "ev-technician", description: "Services electric vehicles and traction systems.", sectorId: automotive.id },
  });

  // role_skills
  const link = (role: string, code: string, importance: number) =>
    db.roleSkill.create({
      data: { jobRoleId: role, skillId: skillByCode[code].id, importance },
    });
  await Promise.all([
    link(automationEng.id, "plc-programming", 5),
    link(automationEng.id, "scada", 5),
    link(automationEng.id, "industrial-robotics", 4),
    link(automationEng.id, "industrial-iot", 4),
    link(automationEng.id, "python", 3),
    link(plcTech.id, "plc-programming", 5),
    link(plcTech.id, "scada", 4),
    link(plcTech.id, "workplace-safety", 3),
    link(roboticsTech.id, "industrial-robotics", 5),
    link(roboticsTech.id, "plc-programming", 3),
    link(roboticsTech.id, "workplace-safety", 4),
    link(softwareDev.id, "python", 5),
    link(softwareDev.id, "sql", 4),
    link(softwareDev.id, "embedded-systems", 2),
    link(evTech.id, "battery-management-systems", 5),
    link(evTech.id, "electric-motor-drives", 5),
    link(evTech.id, "embedded-systems", 3),
    link(evTech.id, "workplace-safety", 4),
  ]);

  // ===== Qualifications =====
  const cert = await db.qualification.create({
    data: { name: "Skill Certificate", code: "CERT", description: "Short-cycle occupational certification.", qualificationLevel: "Certificate" },
  });
  const diploma = await db.qualification.create({
    data: { name: "Technical Diploma", code: "DIP", description: "Mid-cycle technical diploma.", qualificationLevel: "Diploma" },
  });
  const advDiploma = await db.qualification.create({
    data: { name: "Advanced Diploma", code: "ADV-DIP", description: "Advanced occupational diploma.", qualificationLevel: "Advanced Diploma" },
  });

  // ===== Courses =====
  const cAutomation = await db.course.create({
    data: { name: "Industrial Automation", code: "CRS-AUTO-01", description: "PLC, SCADA, and industrial control fundamentals.", sectorId: advMfg.id, qualificationId: diploma.id, durationHours: 320, status: "ACTIVE" },
  });
  const cRobotics = await db.course.create({
    data: { name: "Robotics Technician", code: "CRS-ROB-01", description: "Industrial robot operation and maintenance.", sectorId: advMfg.id, qualificationId: cert.id, durationHours: 240, status: "ACTIVE" },
  });
  const cEV = await db.course.create({
    data: { name: "EV Technology", code: "CRS-EV-01", description: "Electric vehicle systems and battery service.", sectorId: automotive.id, qualificationId: advDiploma.id, durationHours: 360, status: "ACTIVE" },
  });
  const cSoftware = await db.course.create({
    data: { name: "Software Development", code: "CRS-SD-01", description: "Full-stack software development foundations.", sectorId: it.id, qualificationId: diploma.id, durationHours: 480, status: "ACTIVE" },
  });
  const cIIoT = await db.course.create({
    data: { name: "Industrial IoT Fundamentals", code: "CRS-IIOT-01", description: "Edge, connectivity, and OT/IT integration basics.", sectorId: advMfg.id, qualificationId: cert.id, durationHours: 200, status: "UNDER_REVIEW" },
  });

  // course_skills
  const cs = (courseId: string, code: string, level: string) =>
    db.courseSkill.create({ data: { courseId, skillId: skillByCode[code].id, coverageLevel: level } });
  await Promise.all([
    cs(cAutomation.id, "plc-programming", "MASTERED"),
    cs(cAutomation.id, "scada", "REINFORCED"),
    cs(cAutomation.id, "workplace-safety", "INTRODUCED"),
    cs(cRobotics.id, "industrial-robotics", "MASTERED"),
    cs(cRobotics.id, "plc-programming", "INTRODUCED"),
    cs(cRobotics.id, "workplace-safety", "REINFORCED"),
    cs(cEV.id, "battery-management-systems", "MASTERED"),
    cs(cEV.id, "electric-motor-drives", "REINFORCED"),
    cs(cEV.id, "workplace-safety", "REINFORCED"),
    cs(cSoftware.id, "python", "MASTERED"),
    cs(cSoftware.id, "sql", "REINFORCED"),
    cs(cSoftware.id, "embedded-systems", "INTRODUCED"),
    cs(cIIoT.id, "industrial-iot", "MASTERED"),
    cs(cIIoT.id, "python", "INTRODUCED"),
  ]);

  // ===== Institutions (clearly fictional) =====
  const instPune = await db.institution.create({
    data: { name: "Demo Skill Centre Pune", institutionType: "Skill Centre", districtId: pune.id, description: "Synthetic demonstration training centre.", address: "Demo Road, Pune", latitude: 18.5300, longitude: 73.8400, isActive: true },
  });
  const instNashik = await db.institution.create({
    data: { name: "Demo Technical Institute Nashik", institutionType: "Polytechnic", districtId: nashik.id, description: "Synthetic demonstration polytechnic.", address: "Demo Marg, Nashik", latitude: 19.9900, longitude: 73.7800, isActive: true },
  });
  const instNagpur = await db.institution.create({
    data: { name: "Demo Training Hub Nagpur", institutionType: "ITI", districtId: nagpur.id, description: "Synthetic demonstration training hub.", address: "Demo Chowk, Nagpur", latitude: 21.1500, longitude: 79.0900, isActive: true },
  });

  // course_institutions
  await Promise.all([
    db.courseInstitution.create({ data: { courseId: cAutomation.id, institutionId: instPune.id, capacity: 40 } }),
    db.courseInstitution.create({ data: { courseId: cRobotics.id, institutionId: instPune.id, capacity: 30 } }),
    db.courseInstitution.create({ data: { courseId: cSoftware.id, institutionId: instPune.id, capacity: 50 } }),
    db.courseInstitution.create({ data: { courseId: cAutomation.id, institutionId: instNashik.id, capacity: 25 } }),
    db.courseInstitution.create({ data: { courseId: cEV.id, institutionId: instNashik.id, capacity: 20 } }),
    db.courseInstitution.create({ data: { courseId: cEV.id, institutionId: instNagpur.id, capacity: 30 } }),
    db.courseInstitution.create({ data: { courseId: cIIoT.id, institutionId: instNagpur.id, capacity: 20 } }),
  ]);

  // ===== Employers (clearly fictional) =====
  const emp1 = await db.employer.create({
    data: { name: "Demo Automation Works Pvt Ltd", industrySectorId: advMfg.id, districtId: pune.id, description: "Synthetic demonstration employer — automation integrator.", website: "https://example.org/demo-automation-works", sizeCategory: "MEDIUM", isVerified: true },
  });
  const emp2 = await db.employer.create({
    data: { name: "Demo Motors EV Assembly", industrySectorId: automotive.id, districtId: nashik.id, description: "Synthetic demonstration employer — EV assembly.", website: "https://example.org/demo-motors", sizeCategory: "LARGE", isVerified: true },
  });
  const emp3 = await db.employer.create({
    data: { name: "Demo Software Solutions", industrySectorId: it.id, districtId: pune.id, description: "Synthetic demonstration employer — software services.", website: "https://example.org/demo-software", sizeCategory: "MEDIUM", isVerified: false },
  });
  const emp4 = await db.employer.create({
    data: { name: "Demo Robotics Integrators", industrySectorId: advMfg.id, districtId: nagpur.id, description: "Synthetic demonstration employer — robotics integrator.", website: "https://example.org/demo-robotics", sizeCategory: "SMALL", isVerified: false },
  });
  const emp5 = await db.employer.create({
    data: { name: "Demo Battery Systems", industrySectorId: automotive.id, districtId: nagpur.id, description: "Synthetic demonstration employer — battery pack manufacturer.", website: "https://example.org/demo-battery", sizeCategory: "MEDIUM", isVerified: true },
  });

  // employer_roles
  await Promise.all([
    db.employerRole.create({ data: { employerId: emp1.id, jobRoleId: automationEng.id } }),
    db.employerRole.create({ data: { employerId: emp1.id, jobRoleId: plcTech.id } }),
    db.employerRole.create({ data: { employerId: emp2.id, jobRoleId: evTech.id } }),
    db.employerRole.create({ data: { employerId: emp3.id, jobRoleId: softwareDev.id } }),
    db.employerRole.create({ data: { employerId: emp4.id, jobRoleId: roboticsTech.id } }),
    db.employerRole.create({ data: { employerId: emp5.id, jobRoleId: evTech.id } }),
  ]);

  // ===== Data Sources (provenance) =====
  const sources = [
    { name: "Synthetic Job Posting Feed", sourceType: "JOB_POSTING", description: "Synthetic job-posting signals for demonstration.", dataStatus: "DEMO" },
    { name: "Synthetic Employer Survey", sourceType: "EMPLOYER_SURVEY", description: "Synthetic employer survey responses.", dataStatus: "DEMO" },
    { name: "Synthetic Course Catalogue", sourceType: "TRAINING_PROVIDER", description: "Synthetic course and curriculum catalogue.", dataStatus: "DEMO" },
    { name: "Synthetic Placement Outcomes", sourceType: "PLACEMENT_OUTCOME", description: "Synthetic placement and outcome records.", dataStatus: "DEMO" },
    { name: "Synthetic Sector Growth Index", sourceType: "SECTOR_GROWTH", description: "Synthetic sector growth indicators.", dataStatus: "DEMO" },
  ];
  await Promise.all(
    sources.map((s) =>
      db.dataSource.create({ data: { ...s, sourceUrl: null, lastUpdatedAt: new Date() } })
    )
  );

  // ===== Demo Users (RBAC) =====
  const demoUsers = [
    { email: "admin@kaushal-drishti.demo", name: "Demo State Admin", role: "STATE_ADMIN", passwordHash: "demo-admin" },
    { email: "planner@kaushal-drishti.demo", name: "Demo District Planner", role: "DISTRICT_PLANNER", passwordHash: "demo-planner" },
    { email: "employer@kaushal-drishti.demo", name: "Demo Employer", role: "EMPLOYER", passwordHash: "demo-employer" },
    { email: "provider@kaushal-drishti.demo", name: "Demo Training Provider", role: "TRAINING_PROVIDER", passwordHash: "demo-provider" },
  ];
  for (const u of demoUsers) {
    await db.user.create({ data: u });
  }

  console.log("✓ Seed complete. All data is SYNTHETIC DEMONSTRATION DATA.");
  console.log("  Districts: 3 | Sectors: 3 | JobRoles: 5 | Skills: 10 | Courses: 5 | Employers: 5 | DataSources: 5 | Users: 4");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
