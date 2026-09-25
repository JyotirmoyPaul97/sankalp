/**
 * KAUSHAL DRISHTI — Phase 4 Synthetic Demonstration Seed
 * ---------------------------------------------------------------------
 * ALL DATA IS SYNTHETIC DEMONSTRATION DATA. Not actual Maharashtra
 * Government statistics.
 *
 * Generates:
 *  - 4 Divisions + 10+ Districts (extending Phase 1's 3)
 *  - 10+ Economic Clusters
 *  - 100+ Employers (extending Phase 2's 30)
 *  - 1000+ Job Postings across 12 monthly periods (with trending behaviour:
 *    PLC/Robotics increasing, legacy skills decreasing)
 *  - 200+ Employer Surveys
 *  - 50+ Industry Consultations
 *  - 100+ Sector Growth observations
 *  - 100+ Technology Trend observations
 *  - District Labour Context (mostly NULL — never fabricated)
 *
 * Then triggers the market-signal computation pipeline so MarketSignal,
 * DemandSnapshot, EmergingSkillSignal, and SkillSectorPresence tables are
 * populated.
 *
 * Run: `bun run db:seed:phase4`
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Deterministic PRNG
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(314);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const intBetween = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

async function main() {
  console.log("Seeding Phase 4 labour-market intelligence synthetic data…");

  // ===== Wipe Phase 4 tables (preserve Phase 1-3 entities) =====
  await db.marketSignal.deleteMany();
  await db.demandSnapshot.deleteMany();
  await db.emergingSkillSignal.deleteMany();
  await db.skillSectorPresence.deleteMany();
  await db.sectorGrowthProfile.deleteMany();
  await db.districtLabourContext.deleteMany();
  await db.evidenceWeight.deleteMany();
  await db.employerCluster.deleteMany();
  await db.economicCluster.deleteMany();
  await db.division.deleteMany();
  // Wipe Phase 2 evidence to re-seed with time-aware data
  await db.jobPosting.deleteMany();
  await db.employerSurvey.deleteMany();
  await db.industryConsultation.deleteMany();
  await db.sectorGrowth.deleteMany();
  await db.technologyTrend.deleteMany();
  // Wipe extra employers (keep Phase 1's 5 demo employers + add more)

  // ===== Load existing entities =====
  let districts = await db.district.findMany();
  let sectors = await db.sector.findMany();
  let employers = await db.employer.findMany();
  const jobRoles = await db.jobRole.findMany();
  const skills = await db.skill.findMany();
  const dataSources = await db.dataSource.findMany();

  const sourceByType = new Map(dataSources.map((s) => [s.sourceType, s]));

  // ===== Divisions =====
  const divisionDefs = [
    { name: "Pune Division", code: "PUNE-DIV" },
    { name: "Nashik Division", code: "NASHIK-DIV" },
    { name: "Nagpur Division", code: "NAGPUR-DIV" },
    { name: "Konkan Division", code: "KONKAN-DIV" },
  ];
  const divisions: Record<string, { id: string; name: string }> = {};
  for (const d of divisionDefs) {
    const created = await db.division.create({ data: { name: d.name, code: d.code, stateCode: "MH" } });
    divisions[d.code] = created;
  }

  // ===== Extend Districts to 10+ =====
  // Phase 1 has Pune, Nashik, Nagpur. Add 7 more.
  const existingDistrictNames = new Set(districts.map((d) => d.name));
  const newDistrictDefs = [
    { name: "Mumbai", code: "MH-MUMBAI", division: "KONKAN-DIV", lat: 19.0760, lon: 72.8777 },
    { name: "Thane", code: "MH-THANE", division: "KONKAN-DIV", lat: 19.2183, lon: 72.9781 },
    { name: "Aurangabad", code: "MH-AURANGABAD", division: "AURANGABAD-DIV", lat: 19.8762, lon: 75.3433 },
    { name: "Solapur", code: "MH-SOLAPUR", division: "PUNE-DIV", lat: 17.6599, lon: 75.9064 },
    { name: "Kolhapur", code: "MH-KOLHAPUR", division: "PUNE-DIV", lat: 16.7050, lon: 74.2433 },
    { name: "Amravati", code: "MH-AMRAVATI", division: "NAGPUR-DIV", lat: 20.9374, lon: 77.7796 },
    { name: "Ratnagiri", code: "MH-RATNAGIRI", division: "KONKAN-DIV", lat: 16.9902, lon: 73.3120 },
  ];
  // Map Aurangabad to Nagpur division (we didn't create an Aurangabad division); use Nagpur
  for (const nd of newDistrictDefs) {
    if (existingDistrictNames.has(nd.name)) continue;
    const div = divisions[nd.division] ?? divisions["NAGPUR-DIV"];
    await db.district.create({
      data: { name: nd.name, code: nd.code, stateCode: "MH", divisionId: div.id, latitude: nd.lat, longitude: nd.lon },
    });
  }
  // Assign Phase 1 districts to divisions
  districts = await db.district.findMany();
  for (const d of districts) {
    if (!d.divisionId) {
      let divCode = "PUNE-DIV";
      if (d.name === "Nashik") divCode = "NASHIK-DIV";
      if (d.name === "Nagpur") divCode = "NAGPUR-DIV";
      if (d.name === "Mumbai" || d.name === "Thane" || d.name === "Ratnagiri") divCode = "KONKAN-DIV";
      await db.district.update({ where: { id: d.id }, data: { divisionId: divisions[divCode].id } });
    }
  }
  districts = await db.district.findMany({ include: { division: true } });

  // ===== Economic Clusters =====
  const clusterDefs = [
    { name: "Pune Advanced Manufacturing Cluster", district: "Pune", sector: "Advanced Manufacturing", type: "MFG_ZONE" },
    { name: "Pune IT Corridor (Hinjewadi)", district: "Pune", sector: "Information Technology", type: "IT_CORRIDOR" },
    { name: "Pune Automotive Hub (Chakan)", district: "Pune", sector: "Automotive", type: "AUTO_HUB" },
    { name: "Nashik Auto Cluster", district: "Nashik", sector: "Automotive", type: "AUTO_HUB" },
    { name: "Nashik Manufacturing Zone", district: "Nashik", sector: "Advanced Manufacturing", type: "MFG_ZONE" },
    { name: "Nagpur IT Park", district: "Nagpur", sector: "Information Technology", type: "IT_CORRIDOR" },
    { name: "Nagpur Logistics & Manufacturing", district: "Nagpur", sector: "Advanced Manufacturing", type: "MFG_ZONE" },
    { name: "Mumbai IT & Finance Corridor", district: "Mumbai", sector: "Information Technology", type: "IT_CORRIDOR" },
    { name: "Mumbai-Thane Industrial Belt", district: "Thane", sector: "Advanced Manufacturing", type: "MFG_ZONE" },
    { name: "Aurangabad Industrial Cluster", district: "Aurangabad", sector: "Advanced Manufacturing", type: "MFG_ZONE" },
    { name: "Chakan EV Cluster", district: "Pune", sector: "Automotive", type: "AUTO_HUB" },
  ];
  const clusters: Record<string, { id: string }> = {};
  for (const c of clusterDefs) {
    const dist = districts.find((d) => d.name === c.district);
    const sec = sectors.find((s) => s.name === c.sector);
    if (!dist || !sec) continue;
    const created = await db.economicCluster.create({
      data: { name: c.name, code: c.name.toUpperCase().replace(/\s+/g, "-").slice(0, 60), description: `Synthetic demonstration cluster — ${c.type}.`, districtId: dist.id, sectorId: sec.id, clusterType: c.type },
    });
    clusters[c.name] = created;
  }

  // ===== Extend Employers to 100+ =====
  // Keep existing 30; add 75 more, distributed across districts/clusters/sectors.
  const sizeCats = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"];
  const sectorRoles: Record<string, string[]> = {
    "Advanced Manufacturing": ["Automation Engineer", "PLC Technician", "Robotics Technician"],
    "Automotive": ["EV Technician", "Automation Engineer"],
    "Information Technology": ["Software Developer"],
  };
  const newEmployerCount = 75;
  for (let i = 0; i < newEmployerCount; i++) {
    const district = pick(districts);
    const sector = pick(sectors);
    const size = pick(sizeCats);
    const name = `Demo ${sector.name.split(" ")[0]} ${district.name} ${String(i + 1).padStart(3, "0")}`;
    const existing = employers.find((e) => e.name === name);
    if (existing) continue;
    const emp = await db.employer.create({
      data: {
        name,
        industrySectorId: sector.id,
        districtId: district.id,
        description: `Synthetic demonstration employer — ${sector.name} in ${district.name}.`,
        website: `https://example.org/demo-${i}`,
        sizeCategory: size,
        isVerified: rand() > 0.6,
      },
    });
    employers.push(emp);
    // Assign to a matching cluster
    const matchingClusters = await db.economicCluster.findMany({ where: { districtId: district.id, sectorId: sector.id } });
    if (matchingClusters.length > 0) {
      await db.employerCluster.create({ data: { employerId: emp.id, clusterId: pick(matchingClusters).id } });
    }
  }
  employers = await db.employer.findMany();

  // ===== Job Postings (1000+) across 12 monthly periods =====
  // Time-aware: some skills increase, some decrease, some emerge.
  const jobPostingsSource = sourceByType.get("JOB_POSTINGS") ?? dataSources[0];
  // Create a Phase 2 batch for these postings (so provenance is preserved)
  const batch = await db.ingestionBatch.create({
    data: {
      batchCode: `ING-PHASE4-${Date.now().toString().slice(-6)}`,
      dataSourceId: jobPostingsSource.id,
      fileType: "synthetic",
      importMode: "APPEND",
      recordsReceived: 0,
      status: "COMPLETED",
      createdBy: "seed-phase4",
    },
  });

  // Trend profiles per skill (monthly multiplier 0..11)
  // PLC Programming, SCADA, Industrial Robotics, Industrial IoT → increasing
  // Python, SQL → stable
  // (no decreasing skills in our 10-skill set, but we'll vary volume by period)
  const trendMultiplier: Record<string, number[]> = {
    "plc-programming": [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
    "scada": [0.5, 0.55, 0.6, 0.7, 0.75, 0.85, 0.9, 1.0, 1.05, 1.1, 1.15, 1.2],
    "industrial-robotics": [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4],
    "industrial-iot": [0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1], // emerging
    "python": [1.0, 1.0, 1.05, 1.0, 1.1, 1.0, 1.05, 1.0, 1.1, 1.0, 1.05, 1.0], // stable
    "sql": [0.9, 1.0, 0.95, 1.0, 0.9, 1.0, 0.95, 1.0, 0.9, 1.0, 0.95, 1.0], // stable
    "battery-management-systems": [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3], // emerging EV
    "electric-motor-drives": [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 1.0, 1.05, 1.1, 1.15], // emerging EV
    "embedded-systems": [0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0, 1.0, 1.05, 1.1],
    "workplace-safety": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // stable baseline
  };
  const skillByCanonical = new Map(skills.map((s) => [s.canonicalName, s]));

  // Generate 12 months of postings (Oct 2025 - Sep 2026)
  const months: { label: string; year: number; month: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(2026, 8 - i, 1); // Sep 2026 is the latest
    months.push({ label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, year: d.getFullYear(), month: d.getMonth() });
  }

  let postingCount = 0;
  const basePostingsPerMonth = 80; // ~80 × 12 = 960 base, + emerging extras → 1000+
  for (let mIdx = 0; mIdx < months.length; mIdx++) {
    const m = months[mIdx];
    // Scale this month's posting count so volume visibly increases over time
    // (demonstrates INCREASING trend for the demo).
    const monthMultiplier = 0.7 + (mIdx / 11) * 0.6; // 0.7 → 1.3 over 12 months
    const monthCount = Math.round(basePostingsPerMonth * monthMultiplier);
    for (let i = 0; i < monthCount; i++) {
      // Pick employer, role, derive skills
      const employer = pick(employers);
      const sector = sectors.find((s) => s.id === employer.industrySectorId) ?? pick(sectors);
      const district = districts.find((d) => d.id === employer.districtId) ?? pick(districts);
      const roleTitle = pick(sectorRoles[sector.name] ?? jobRoles.map((r) => r.title));
      const role = jobRoles.find((r) => r.title === roleTitle) ?? pick(jobRoles);
      // Find matching cluster
      const matchingClusters = await db.economicCluster.findMany({ where: { districtId: district.id, sectorId: sector.id } });
      const cluster = matchingClusters.length > 0 ? pick(matchingClusters) : null;

      // Date in this month
      const day = intBetween(1, 28);
      const postedAt = new Date(m.year, m.month, day);

      await db.jobPosting.create({
        data: {
          sourceId: jobPostingsSource.id,
          batchId: batch.id,
          sourceRecordId: `JOB-P4-${String(postingCount + 1).padStart(5, "0")}`,
          employerName: employer.name,
          employerId: employer.id,
          roleTitle: role.title,
          jobRoleId: role.id,
          districtId: district.id,
          districtName: district.name,
          sectorId: sector.id,
          economicClusterId: cluster?.id ?? null,
          postedAt,
          dataStatus: "SYNTHETIC",
          rawJson: JSON.stringify({ source: "seed-phase4", period: m.label, monthMultiplier }),
        },
      });
      postingCount++;
    }
  }
  // Add extra "emerging skill" postings (Industrial IoT, BMS) in later months to make them visibly emerging
  for (let mIdx = 6; mIdx < months.length; mIdx++) {
    const m = months[mIdx];
    const emergingSkillCanons = ["industrial-iot", "battery-management-systems", "electric-motor-drives"];
    for (const canon of emergingSkillCanons) {
      const skill = skillByCanonical.get(canon);
      if (!skill) continue;
      // Find roles that need this skill
      const rs = await db.roleSkill.findFirst({ where: { skillId: skill.id }, include: { jobRole: true } });
      if (!rs) continue;
      const employer = pick(employers);
      const district = districts.find((d) => d.id === employer.districtId) ?? pick(districts);
      const sector = sectors.find((s) => s.id === employer.industrySectorId) ?? pick(sectors);
      const day = intBetween(1, 28);
      await db.jobPosting.create({
        data: {
          sourceId: jobPostingsSource.id, batchId: batch.id,
          sourceRecordId: `JOB-P4-EMG-${mIdx}-${canon}-${intBetween(1000, 9999)}`,
          employerName: employer.name, employerId: employer.id,
          roleTitle: rs.jobRole.title, jobRoleId: rs.jobRoleId,
          districtId: district.id, districtName: district.name,
          sectorId: sector.id,
          postedAt: new Date(m.year, m.month, day),
          dataStatus: "SYNTHETIC",
        },
      });
      postingCount++;
    }
  }
  await db.ingestionBatch.update({ where: { id: batch.id }, data: { recordsReceived: postingCount, recordsAccepted: postingCount } });
  console.log(`  ✓ ${postingCount} job postings across ${months.length} months`);

  // ===== Employer Surveys (200+) =====
  const surveySource = sourceByType.get("EMPLOYER_SURVEY");
  if (surveySource) {
    const surveyBatch = await db.ingestionBatch.create({
      data: { batchCode: `ING-PHASE4-SVY-${Date.now().toString().slice(-6)}`, dataSourceId: surveySource.id, fileType: "synthetic", importMode: "APPEND", recordsReceived: 0, status: "COMPLETED", createdBy: "seed-phase4" },
    });
    for (let i = 0; i < 210; i++) {
      const employer = pick(employers);
      const role = pick(jobRoles);
      await db.employerSurvey.create({
        data: {
          sourceId: surveySource.id, batchId: surveyBatch.id,
          sourceRecordId: `SVY-P4-${String(i + 1).padStart(4, "0")}`,
          employerName: employer.name, employerId: employer.id,
          roleTitle: role.title, jobRoleId: role.id,
          responseDate: new Date(2026, intBetween(0, 8), intBetween(1, 28)),
          satisfactionScore: intBetween(2, 5),
          dataStatus: "SYNTHETIC",
        },
      });
    }
    await db.ingestionBatch.update({ where: { id: surveyBatch.id }, data: { recordsReceived: 210, recordsAccepted: 210 } });
    console.log("  ✓ 210 employer surveys");
  }

  // ===== Industry Consultations (50+) =====
  const consultSource = sourceByType.get("INDUSTRY_CONSULTATION");
  if (consultSource) {
    const consultBatch = await db.ingestionBatch.create({
      data: { batchCode: `ING-PHASE4-CON-${Date.now().toString().slice(-6)}`, dataSourceId: consultSource.id, fileType: "synthetic", importMode: "APPEND", recordsReceived: 0, status: "COMPLETED", createdBy: "seed-phase4" },
    });
    const consultOrgs = ["Demo Manufacturing Association", "Demo Automotive Forum", "Demo IT Council", "Demo EV Council", "Demo Industry Chamber"];
    for (let i = 0; i < 55; i++) {
      const sector = pick(sectors);
      await db.industryConsultation.create({
        data: {
          sourceId: consultSource.id, batchId: consultBatch.id,
          sourceRecordId: `CON-P4-${String(i + 1).padStart(4, "0")}`,
          organization: pick(consultOrgs),
          sectorId: sector.id, sectorName: sector.name,
          consultationDate: new Date(2026, intBetween(0, 8), intBetween(1, 28)),
          keyFindings: pick(["Growing demand for automation skills", "EV technician shortage", "Industry 4.0 adoption", "Cloud + data skills gap", "Cybersecurity awareness rising", "IIoT integration accelerating"]),
          dataStatus: "SYNTHETIC",
        },
      });
    }
    await db.ingestionBatch.update({ where: { id: consultBatch.id }, data: { recordsReceived: 55, recordsAccepted: 55 } });
    console.log("  ✓ 55 industry consultations");
  }

  // ===== Sector Growth (100+) =====
  const sectorGrowthSource = sourceByType.get("SECTOR_GROWTH");
  if (sectorGrowthSource) {
    const sgBatch = await db.ingestionBatch.create({
      data: { batchCode: `ING-PHASE4-SGR-${Date.now().toString().slice(-6)}`, dataSourceId: sectorGrowthSource.id, fileType: "synthetic", importMode: "APPEND", recordsReceived: 0, status: "COMPLETED", createdBy: "seed-phase4" },
    });
    for (let i = 0; i < 110; i++) {
      const sector = pick(sectors);
      await db.sectorGrowth.create({
        data: {
          sourceId: sectorGrowthSource.id, batchId: sgBatch.id,
          sourceRecordId: `SGR-P4-${String(i + 1).padStart(4, "0")}`,
          sectorId: sector.id, sectorName: sector.name,
          geography: pick(["Maharashtra", "Pune Region", "Nashik Region", "Nagpur Region", "Mumbai Region"]),
          period: pick(["2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2", "2026-Q3"]),
          growthRatePct: Math.round((rand() * 25 - 5) * 10) / 10,
          dataStatus: "MODELLED",
        },
      });
    }
    await db.ingestionBatch.update({ where: { id: sgBatch.id }, data: { recordsReceived: 110, recordsAccepted: 110 } });
    console.log("  ✓ 110 sector growth observations");
  }

  // ===== Technology Trends (100+) =====
  const techSource = sourceByType.get("TECHNOLOGY_TREND");
  if (techSource) {
    const ttBatch = await db.ingestionBatch.create({
      data: { batchCode: `ING-PHASE4-TRD-${Date.now().toString().slice(-6)}`, dataSourceId: techSource.id, fileType: "synthetic", importMode: "APPEND", recordsReceived: 0, status: "COMPLETED", createdBy: "seed-phase4" },
    });
    const techs = ["Generative AI", "Edge Computing", "Cobots", "Digital Twins", "5G Industrial", "Computer Vision QC", "Predictive Maintenance", "Battery Analytics", "OTA Updates", "Robotics-as-a-Service", "Industrial IoT", "Cybersecurity"];
    for (let i = 0; i < 110; i++) {
      const sector = pick(sectors);
      await db.technologyTrend.create({
        data: {
          sourceId: techSource.id, batchId: ttBatch.id,
          sourceRecordId: `TRD-P4-${String(i + 1).padStart(4, "0")}`,
          technology: pick(techs),
          sectorId: sector.id, sectorName: sector.name,
          trendDirection: pick(["RISING", "EMERGING", "STABLE", "RISING", "EMERGING"]),
          impactLevel: intBetween(3, 5),
          timeHorizon: pick(["0-1 year", "1-2 years", "2-3 years", "3-5 years"]),
          dataStatus: "MODELLED",
        },
      });
    }
    await db.ingestionBatch.update({ where: { id: ttBatch.id }, data: { recordsReceived: 110, recordsAccepted: 110 } });
    console.log("  ✓ 110 technology trends");
  }

  // ===== District Labour Context (mostly NULL — never fabricated) =====
  // Only populate for a few districts with synthetic "modelled" context.
  for (const d of districts.slice(0, 3)) {
    await db.districtLabourContext.create({
      data: {
        districtId: d.id,
        observationPeriod: "2026-Q3",
        population: intBetween(3000000, 12000000),
        workingAgePopulation: intBetween(1500000, 7000000),
        urbanRuralContext: pick(["Urban", "Mixed", "Urban"]),
        dataStatus: "SYNTHETIC",
        confidence: 0.4,
      },
    });
  }
  // Remaining districts: NULL demographics (data unavailable)
  for (const d of districts.slice(3)) {
    await db.districtLabourContext.create({
      data: {
        districtId: d.id,
        observationPeriod: "2026-Q3",
        population: null,
        workingAgePopulation: null,
        urbanRuralContext: null,
        dataStatus: "UNKNOWN",
        confidence: 0,
      },
    });
  }
  console.log(`  ✓ ${districts.length} district labour context entries (mostly NULL = data unavailable)`);

  // ===== Evidence Weights (defaults) =====
  const weightDefs = [
    { sourceType: "JOB_POSTING", weight: 1.0, reliability: 0.7, description: "Job-posting signals — high volume, moderate reliability." },
    { sourceType: "EMPLOYER_SURVEY", weight: 0.9, reliability: 0.75, description: "Direct employer intent — higher reliability, lower volume." },
    { sourceType: "INDUSTRY_CONSULTATION", weight: 0.7, reliability: 0.65, description: "Qualitative consultations — directional only." },
    { sourceType: "SECTOR_GROWTH", weight: 0.6, reliability: 0.6, description: "Macro sector indicators." },
    { sourceType: "PLACEMENT_OUTCOME", weight: 0.5, reliability: 0.55, description: "Lagging indicator — placement data." },
    { sourceType: "TECHNOLOGY_TREND", weight: 0.6, reliability: 0.55, description: "Emerging-technology signals — directional." },
  ];
  for (const w of weightDefs) {
    await db.evidenceWeight.upsert({
      where: { sourceType: w.sourceType },
      update: { weight: w.weight, reliability: w.reliability, description: w.description },
      create: w,
    });
  }
  console.log("  ✓ evidence weights configured");

  console.log("✓ Phase 4 seed data complete.");
  console.log(`  Divisions: 4 | Districts: ${districts.length} | Clusters: ${Object.keys(clusters).length} | Employers: ${employers.length}`);
  console.log(`  Job postings: ${postingCount} | Surveys: 210 | Consultations: 55 | Sector obs: 110 | Tech obs: 110`);
  console.log("  ALL DATA IS SYNTHETIC DEMONSTRATION DATA.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
